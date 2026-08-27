import { User } from '@prisma/client';

/**
 * Renders a profile as compact plain text for use inside a prompt — only
 * fields that are actually filled in are included, since blank
 * "Title: \nSummary: \n" lines waste tokens on the free tier for no benefit.
 */
export function formatProfileForPrompt(user: User): string {
  const lines: string[] = [`Name: ${user.name}`];

  if (user.title) lines.push(`Title: ${user.title}`);
  if (user.summary) lines.push(`Summary: ${user.summary}`);
  if (user.skills.length) lines.push(`Skills: ${user.skills.join(', ')}`);
  if (user.languages.length) lines.push(`Languages: ${user.languages.join(', ')}`);

  const experience = user.experience as unknown as Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  if (experience.length) {
    lines.push('Experience:');
    for (const item of experience) {
      const desc = item.description ? ` — ${item.description}` : '';
      lines.push(`- ${item.role} at ${item.company} (${item.duration})${desc}`);
    }
  }

  const education = user.education as unknown as Array<{
    institution: string;
    degree: string;
    duration: string;
    description?: string;
  }>;
  if (education.length) {
    lines.push('Education:');
    for (const item of education) {
      const desc = item.description ? ` — ${item.description}` : '';
      lines.push(`- ${item.degree}, ${item.institution} (${item.duration})${desc}`);
    }
  }

  return lines.join('\n');
}
