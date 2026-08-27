import { User } from '@prisma/client';
import { formatProfileForPrompt } from './format-profile';

export function buildResumePrompt(user: User): string {
  return `You are a resume writer. Using ONLY the candidate data below, write a clean, professional resume in Markdown. Do not invent any facts, companies, dates, or skills not present in the data. If a section has no data, omit that section entirely. Use standard resume section headers (Summary, Skills, Experience, Education, Languages as applicable). Keep bullet points concise and action-oriented.

Candidate data:
${formatProfileForPrompt(user)}

Output only the Markdown resume, no commentary before or after it.`;
}
