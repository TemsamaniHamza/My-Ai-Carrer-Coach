import { User } from '@prisma/client';
import { formatProfileForPrompt } from './format-profile';
import { InterviewType } from '../dto/start-session.dto';

interface RecentExchange {
  question: string;
  answer: string;
}

const TYPE_INSTRUCTIONS: Record<InterviewType, string> = {
  behavioral:
    'Keep the next question behavioral — about past experience, decisions, teamwork, conflict, or growth. Do not switch to a technical question.',
  technical:
    "Keep the next question technical and grounded in the candidate's actual listed skills/experience, at a realistic first-round depth. Do not switch to a behavioral question.",
  mixed: 'The next question can be behavioral or technical — your choice.',
};

/**
 * Builds the prompt for evaluating one answer and (unless this was the
 * final question) asking the next one. Only the last few exchanges are
 * included as context, not the full session history — keeps the prompt
 * bounded as a session grows, which matters on the free tier.
 */
export function buildInterviewAnswerPrompt(
  user: User,
  recentExchanges: RecentExchange[],
  latestQuestion: string,
  latestAnswer: string,
  isFinalQuestion: boolean,
  type: InterviewType,
): string {
  const historyText = recentExchanges
    .map((ex) => `Q: ${ex.question}\nA: ${ex.answer}`)
    .join('\n\n');

  // The one real bug being fixed here: previously nothing told the model
  // what to do with a WEAK answer, so it kept narrowing in on the same
  // topic ("dive deeper", "be more specific") even after the candidate had
  // clearly shown they didn't know it — which read as unfair badgering
  // rather than a normal interview. Now a weak answer explicitly means
  // "move to a new topic", and only a strong answer earns a deeper
  // follow-up on the same topic.
  const nextQuestionInstruction = isFinalQuestion
    ? 'This was the final question of the interview — set "nextQuestion" to null. Do not ask another question.'
    : `Then decide the next question based on how well they answered:
- If the answer scored 6 or higher: you may ask ONE follow-up that goes a little deeper on the same topic.
- If the answer scored below 6: do NOT follow up on the same topic or ask them to elaborate/be more specific on it — move on to a new, unrelated interview question instead. Never stack more than one follow-up in a row on a topic the candidate is struggling with.
${TYPE_INSTRUCTIONS[type]}
Never repeat a question already asked in this interview. Put the next question in "nextQuestion".`;

  return `You are a friendly, encouraging interviewer conducting a first-round mock interview. Evaluate the candidate's latest answer, then decide the next step.

Candidate profile:
${formatProfileForPrompt(user)}

${historyText ? `Earlier in this interview:\n${historyText}\n\n` : ''}Current question: ${latestQuestion}
Candidate's answer: ${latestAnswer}

Evaluate the answer's clarity, relevance, and depth given the question. Be fair and constructive — a brief or imperfect answer should score in the middle range, not the bottom, unless it's genuinely off-topic or empty. ${nextQuestionInstruction}

Respond with ONLY valid JSON, no markdown code fences, no commentary, in exactly this shape:
{"evaluation": {"score": <integer 1-10>, "feedback": "<2-3 sentence constructive feedback>"}, "nextQuestion": "<string or null>"}`;
}
