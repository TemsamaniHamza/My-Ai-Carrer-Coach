import { InternalServerErrorException, Logger } from '@nestjs/common';

export interface EvaluationResponse {
  evaluation: { score: number; feedback: string };
  nextQuestion: string | null;
}

const logger = new Logger('parseEvaluationResponse');

/**
 * Gemini is instructed to return raw JSON, but models sometimes wrap it in
 * ```json fences anyway (or add stray whitespace) — strip that defensively
 * before parsing rather than trusting the instruction was followed exactly.
 */
export function parseEvaluationResponse(raw: string): EvaluationResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.error(`Failed to parse Gemini JSON response: ${raw}`);
    throw new InternalServerErrorException(
      'AI returned an unexpected response format — please try again',
    );
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as EvaluationResponse).evaluation?.score !== 'number' ||
    typeof (parsed as EvaluationResponse).evaluation?.feedback !== 'string' ||
    !('nextQuestion' in parsed)
  ) {
    logger.error(`Gemini JSON response had unexpected shape: ${raw}`);
    throw new InternalServerErrorException(
      'AI returned an unexpected response format — please try again',
    );
  }

  return parsed as EvaluationResponse;
}
