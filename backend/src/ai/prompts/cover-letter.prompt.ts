import { User } from '@prisma/client';
import { formatProfileForPrompt } from './format-profile';

export function buildCoverLetterPrompt(user: User, jobDescription: string): string {
  return `You are a career coach writing a cover letter. Using ONLY the candidate data below, write a concise, tailored cover letter (3-4 short paragraphs) for the job description provided. Connect the candidate's real experience and skills to what the job asks for. Do not invent facts not present in the candidate data. Do not include a date or postal address header — start directly with a greeting.

Candidate data:
${formatProfileForPrompt(user)}

Job description:
${jobDescription}

Output only the cover letter text, no commentary before or after it.`;
}
