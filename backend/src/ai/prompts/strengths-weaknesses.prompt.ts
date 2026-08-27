export interface StrengthsWeaknesses {
  strengths: string[];
  weaknesses: string[];
}

interface CompletedExchange {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

/**
 * Builds a prompt that updates the candidate's cumulative strengths/
 * weaknesses summary using ONLY the just-finished interview + the previous
 * summary — never the full interview history. This keeps the summary
 * immune to a later interview deletion (it's already baked into stored
 * text by the time that happens) and keeps Gemini usage to one call per
 * completed interview, not one per historical interview reread.
 */
export function buildStrengthsWeaknessesPrompt(
  previous: StrengthsWeaknesses | null,
  exchanges: CompletedExchange[],
): string {
  const transcriptText = exchanges
    .map((ex) => `Q: ${ex.question}\nA: ${ex.answer}\nScore: ${ex.score}/10 — ${ex.feedback}`)
    .join('\n\n');

  const previousText = previous
    ? `Their current strengths/weaknesses summary (from prior interviews):
Strengths: ${previous.strengths.join('; ') || 'none yet'}
Weaknesses: ${previous.weaknesses.join('; ') || 'none yet'}`
    : 'This is their first completed interview — there is no prior summary.';

  return `You maintain a running strengths/weaknesses summary for a candidate practicing mock interviews.

${previousText}

Here is the interview they just completed:
${transcriptText}

Update the summary using ONLY this new interview plus the prior summary above. Keep points that are still supported, drop points this new interview contradicts, add new points this interview reveals, and merge duplicates. Keep each list short (max 4 items), each item a short, specific phrase (not a full sentence).

Respond with ONLY valid JSON, no markdown code fences, no commentary, in exactly this shape:
{"strengths": ["<short phrase>", ...], "weaknesses": ["<short phrase>", ...]}`;
}
