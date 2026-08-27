import { User } from '@prisma/client';
import { formatProfileForPrompt } from './format-profile';
import { InterviewType } from '../dto/start-session.dto';

const TYPE_INSTRUCTIONS: Record<InterviewType, string> = {
  behavioral:
    'Ask ONLY behavioral questions — about past experience, decisions, teamwork, conflict, or growth (e.g. "Tell me about a time…", "How did you handle…"). Do not ask anything that requires reciting technical facts or definitions.',
  technical:
    "Ask ONLY technical questions grounded in the candidate's actual listed skills/experience — but keep it at a realistic first-round depth (e.g. \"how would you approach X\" or \"what's your experience with Y\"), not an expert-level deep-dive.",
  mixed:
    'Ask either a behavioral or a technical question — your choice — but keep it at a realistic first-round interview depth, not a deep technical drill-down.',
};

export function buildInterviewStartPrompt(user: User, type: InterviewType): string {
  return `You are a friendly, encouraging interviewer conducting a first-round mock interview. Based ONLY on the candidate profile below, ask ONE opening interview question that a real interviewer might realistically ask given this candidate's background.

${TYPE_INSTRUCTIONS[type]}

Candidate profile:
${formatProfileForPrompt(user)}

Output only the question text, nothing else — no preamble, no numbering, no quotes.`;
}
