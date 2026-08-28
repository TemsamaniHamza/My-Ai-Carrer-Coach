import { BadGatewayException, Logger } from '@nestjs/common';
import { ExtractedProfile } from './extract-profile-from-resume.prompt';

const logger = new Logger('parseExtractedProfileResponse');

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

interface RawItem {
  [key: string]: unknown;
}

function isValidItem(item: unknown, requiredKeys: string[]): item is RawItem {
  if (typeof item !== 'object' || item === null) return false;
  const record = item as RawItem;
  return requiredKeys.every((key) => typeof record[key] === 'string' && record[key] !== '');
}

/**
 * Unlike parseStrengthsWeaknessesResponse, this throws on a malformed
 * response instead of returning null — extraction IS the result the user
 * asked for (there's no side-effect fallback to silently skip), so a
 * failure here has to surface as a real error, not vanish.
 */
export function parseExtractedProfileResponse(raw: string): ExtractedProfile {
  // Gemini's "no commentary" instruction isn't always followed — a
  // preamble like "Here is the extracted profile:\n\n```json\n{...}\n```"
  // is common enough that anchoring the fence-strip to the very start of
  // the string (as a plain ^-anchored replace would) misses it entirely.
  // Search for a fenced block anywhere in the response instead, and only
  // fall back to trimming the whole string if no fence is found at all.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const cleaned = (fenced ? fenced[1] : raw).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.warn(`Failed to parse extracted-profile JSON response: ${raw}`);
    throw new BadGatewayException(
      "Couldn't read that resume — the AI response wasn't valid. Please try again.",
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new BadGatewayException("Couldn't read that resume — please try again.");
  }
  const candidate = parsed as RawItem;

  const skills = isStringArray(candidate.skills) ? candidate.skills : [];
  const languages = isStringArray(candidate.languages) ? candidate.languages : [];

  const experienceRaw = Array.isArray(candidate.experience) ? candidate.experience : [];
  const experience = experienceRaw
    .filter((item) => isValidItem(item, ['company', 'role', 'duration']))
    .map((item) => {
      const record = item as RawItem;
      return {
        company: record.company as string,
        role: record.role as string,
        duration: record.duration as string,
        ...(typeof record.description === 'string' && record.description
          ? { description: record.description }
          : {}),
      };
    });

  const educationRaw = Array.isArray(candidate.education) ? candidate.education : [];
  const education = educationRaw
    .filter((item) => isValidItem(item, ['institution', 'degree', 'duration']))
    .map((item) => {
      const record = item as RawItem;
      return {
        institution: record.institution as string,
        degree: record.degree as string,
        duration: record.duration as string,
        ...(typeof record.description === 'string' && record.description
          ? { description: record.description }
          : {}),
      };
    });

  return {
    ...(typeof candidate.name === 'string' && candidate.name ? { name: candidate.name } : {}),
    ...(typeof candidate.title === 'string' && candidate.title ? { title: candidate.title } : {}),
    ...(typeof candidate.summary === 'string' && candidate.summary
      ? { summary: candidate.summary }
      : {}),
    skills,
    languages,
    experience,
    education,
  };
}
