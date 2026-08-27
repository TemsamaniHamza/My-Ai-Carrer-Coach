import { Logger } from '@nestjs/common';
import { StrengthsWeaknesses } from './strengths-weaknesses.prompt';

const logger = new Logger('parseStrengthsWeaknessesResponse');

/**
 * Unlike parseEvaluationResponse, this returns null on failure instead of
 * throwing — updating the strengths/weaknesses summary is a side effect of
 * completing an interview, not the interview result itself, so a malformed
 * response here should never fail the user's actual request.
 */
export function parseStrengthsWeaknessesResponse(raw: string): StrengthsWeaknesses | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.warn(`Failed to parse strengths/weaknesses JSON response: ${raw}`);
    return null;
  }

  const candidate = parsed as StrengthsWeaknesses;
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray(candidate.strengths) ||
    !Array.isArray(candidate.weaknesses) ||
    !candidate.strengths.every((s) => typeof s === 'string') ||
    !candidate.weaknesses.every((w) => typeof w === 'string')
  ) {
    logger.warn(`Strengths/weaknesses JSON response had unexpected shape: ${raw}`);
    return null;
  }

  return { strengths: candidate.strengths, weaknesses: candidate.weaknesses };
}
