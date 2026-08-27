import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

// gemini-3.5-flash's free tier turned out to be capped at only 20
// requests/day (confirmed via a real 429 during Day 5 testing) — flash-lite
// is Google's documented fastest/most-cost-effective option and isn't on
// any shutdown countdown, so it's the safer default until proven otherwise.
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

/**
 * Thin wrapper around the Gemini SDK — the one place that knows about
 * @google/genai, the model name, and how to translate its errors into
 * NestJS exceptions. Every AI feature (resume, cover letter, interview
 * prep) goes through generateText() instead of touching the SDK directly.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  // Deliberately NOT validated/constructed in the constructor: unlike the
  // JWT secrets (which the whole app is unusable without), the Gemini key
  // is expected to arrive after the app is already running. Failing fast
  // at boot here would take down /auth and /users too, not just /ai/*.
  // getClient() throws only when an AI route is actually hit without a key.
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI features are not configured yet (missing GEMINI_API_KEY)',
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const client = this.getClient();
      const response = await client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new InternalServerErrorException(
          'AI response was empty — please try again',
        );
      }
      return text;
    } catch (error) {
      // Exceptions we already threw deliberately (missing key, empty
      // response) — rethrow as-is instead of falling through to the
      // generic SDK-error handling below, which would overwrite their
      // specific messages with a vague "failed to generate" one.
      if (
        error instanceof InternalServerErrorException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gemini request failed: ${message}`);

      // The SDK surfaces quota/rate-limit errors as a 429 status embedded in
      // the thrown error — free tier is easy to hit, so this needs to be a
      // distinct, friendly response rather than a generic 500.
      if (message.includes('429') || message.toLowerCase().includes('quota')) {
        throw new ServiceUnavailableException(
          'AI service is temporarily rate-limited (free tier quota). Please try again in a moment.',
        );
      }

      throw new InternalServerErrorException(
        'AI service failed to generate a response',
      );
    }
  }
}
