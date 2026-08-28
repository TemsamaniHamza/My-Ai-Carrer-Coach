/** The subset of UpdateProfileDto that resume text can plausibly fill in — never email/password. */
export interface ExtractedProfile {
  name?: string;
  title?: string;
  summary?: string;
  skills: string[];
  languages: string[];
  experience: { company: string; role: string; duration: string; description?: string }[];
  education: { institution: string; degree: string; duration: string; description?: string }[];
}

const MAX_RESUME_TEXT_CHARS = 15_000; // generous for a 1-2 page resume; caps prompt cost on outliers

/**
 * Builds a prompt that turns raw resume text (extracted from an uploaded
 * PDF/DOCX) into the same shape as UpdateProfileDto, so the frontend can
 * show it as a review step before the user chooses to apply it to their
 * profile — this never writes to the profile itself.
 */
export function buildExtractProfilePrompt(resumeText: string): string {
  const truncated = resumeText.slice(0, MAX_RESUME_TEXT_CHARS);

  return `You extract structured profile data from resume text. Using ONLY the resume text below, extract the candidate's name, title, professional summary, skills, languages, work experience, and education. Do not invent any facts, companies, dates, or skills not present in the text. If a field isn't present, omit it (for name/title/summary) or leave the list empty (for skills/languages/experience/education).

Resume text:
"""
${truncated}
"""

Respond with ONLY valid JSON, no markdown code fences, no commentary, in exactly this shape:
{
  "name": "<string, omit if not found>",
  "title": "<string, omit if not found>",
  "summary": "<a short professional summary, 2-3 sentences, omit if not found>",
  "skills": ["<skill>", ...],
  "languages": ["<language>", ...],
  "experience": [{"company": "<string>", "role": "<string>", "duration": "<e.g. 2022 - Present>", "description": "<1-2 sentence summary, omit if not present>"}],
  "education": [{"institution": "<string>", "degree": "<string>", "duration": "<e.g. 2018 - 2022>", "description": "<omit if not present>"}]
}`;
}
