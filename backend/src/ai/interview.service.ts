import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { buildInterviewStartPrompt } from './prompts/interview-start.prompt';
import { buildInterviewAnswerPrompt } from './prompts/interview-answer.prompt';
import { parseEvaluationResponse } from './prompts/parse-evaluation-response';
import {
  buildStrengthsWeaknessesPrompt,
  StrengthsWeaknesses,
} from './prompts/strengths-weaknesses.prompt';
import { parseStrengthsWeaknessesResponse } from './prompts/parse-strengths-weaknesses-response';
import { InterviewType } from './dto/start-session.dto';

// Fixed length keeps sessions bounded — both for a predictable UX (the user
// knows how long this takes) and to cap total Gemini calls per session on
// the free tier, rather than letting the model decide when to stop.
const MAX_QUESTIONS = 5;

// Only the last few Q/A pairs are sent back to Gemini as context on each
// turn, not the full session history — keeps the prompt size bounded as a
// session grows toward MAX_QUESTIONS.
const CONTEXT_PAIRS = 3;

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  private async getOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    // Same NotFoundException whether the session doesn't exist or belongs
    // to someone else — don't leak which case it is.
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Interview session not found');
    }
    return session;
  }

  async startSession(userId: string, type: InterviewType = 'mixed') {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const question = await this.gemini.generateText(buildInterviewStartPrompt(user, type));

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        status: 'active',
        type,
        messages: { create: { role: 'assistant', content: question } },
      },
      include: { messages: true },
    });

    return {
      sessionId: session.id,
      status: session.status,
      type: session.type,
      question,
    };
  }

  async submitAnswer(userId: string, sessionId: string, answer: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.status !== 'active') {
      throw new NotFoundException('Interview session is already completed');
    }

    const assistantMessages = session.messages.filter((m) => m.role === 'assistant');
    const latestQuestion = assistantMessages[assistantMessages.length - 1];
    const questionNumber = assistantMessages.length;
    const isFinalQuestion = questionNumber >= MAX_QUESTIONS;

    // Pair up prior exchanges (everything before the current pending
    // question) for context, capped to the last few pairs.
    const priorPairs: { question: string; answer: string }[] = [];
    for (let i = 0; i < assistantMessages.length - 1; i++) {
      const q = assistantMessages[i];
      const a = session.messages.find(
        (m) => m.role === 'user' && m.createdAt > q.createdAt,
      );
      if (a) priorPairs.push({ question: q.content, answer: a.content });
    }
    const recentExchanges = priorPairs.slice(-CONTEXT_PAIRS);

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const prompt = buildInterviewAnswerPrompt(
      user,
      recentExchanges,
      latestQuestion.content,
      answer,
      isFinalQuestion,
      session.type as InterviewType,
    );
    const raw = await this.gemini.generateText(prompt);
    const parsed = parseEvaluationResponse(raw);

    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: answer,
        evaluation: parsed.evaluation,
      },
    });

    const sessionComplete = isFinalQuestion || !parsed.nextQuestion;

    if (!sessionComplete && parsed.nextQuestion) {
      await this.prisma.interviewMessage.create({
        data: { sessionId, role: 'assistant', content: parsed.nextQuestion },
      });
    }

    if (sessionComplete) {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'completed' },
      });

      // Best-effort: a failure here should never fail the interview result
      // itself, so it's caught and logged rather than propagated.
      await this.updateStrengthsWeaknesses(user, sessionId, [
        ...session.messages,
        { role: 'user', content: answer, evaluation: parsed.evaluation, createdAt: new Date() },
      ]).catch((err) =>
        this.logger.warn(`Failed to update strengths/weaknesses for user ${userId}: ${err}`),
      );
    }

    return {
      evaluation: parsed.evaluation,
      nextQuestion: sessionComplete ? null : parsed.nextQuestion,
      status: sessionComplete ? 'completed' : 'active',
      questionNumber,
      totalQuestions: MAX_QUESTIONS,
    };
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    return sessions.map((s) => ({
      id: s.id,
      status: s.status,
      type: s.type,
      createdAt: s.createdAt,
      firstQuestion: s.messages[0]?.content ?? null,
    }));
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    return {
      id: session.id,
      status: session.status,
      type: session.type,
      createdAt: session.createdAt,
      messages: session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        evaluation: m.evaluation,
        createdAt: m.createdAt,
      })),
    };
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.getOwnedSession(userId, sessionId);
    // InterviewMessage.session has onDelete: Cascade, so its messages go
    // with it — the strengths/weaknesses summary is unaffected since it's
    // already baked into stored text on the User, not derived live.
    await this.prisma.interviewSession.delete({ where: { id: sessionId } });
  }

  /**
   * Regenerates the cumulative strengths/weaknesses summary using ONLY the
   * interview that just completed plus the previous summary — never the
   * full interview history. One Gemini call per completed interview.
   */
  private async updateStrengthsWeaknesses(
    user: { id: string; strengthsWeaknesses: unknown },
    sessionId: string,
    messages: { role: string; content: string; evaluation: unknown; createdAt: Date }[],
  ) {
    const assistantMessages = messages
      .filter((m) => m.role === 'assistant')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const exchanges = assistantMessages
      .map((q, i) => {
        const a = userMessages[i];
        const evaluation = a?.evaluation as { score: number; feedback: string } | null;
        if (!a || !evaluation) return null;
        return { question: q.content, answer: a.content, score: evaluation.score, feedback: evaluation.feedback };
      })
      .filter((ex): ex is NonNullable<typeof ex> => ex !== null);

    if (exchanges.length === 0) return;

    const previous = (user.strengthsWeaknesses as StrengthsWeaknesses | null) ?? null;
    const prompt = buildStrengthsWeaknessesPrompt(previous, exchanges);
    const raw = await this.gemini.generateText(prompt);
    const parsed = parseStrengthsWeaknessesResponse(raw);
    if (!parsed) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { strengthsWeaknesses: parsed as unknown as object },
    });
  }
}
