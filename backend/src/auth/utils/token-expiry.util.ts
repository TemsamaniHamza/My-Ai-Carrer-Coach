const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60000,
  h: 3600000,
  d: 86400000,
};

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Parses a duration string like "1h" / "7d" into milliseconds. */
export function parseExpiryToMs(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return DEFAULT_EXPIRY_MS;
  const value = Number(match[1]);
  return value * UNIT_MS[match[2]];
}

/** Parses a duration string like "1h" / "7d" into whole seconds (what jsonwebtoken's numeric expiresIn expects). */
export function parseExpiryToSeconds(expiry: string): number {
  return Math.floor(parseExpiryToMs(expiry) / 1000);
}
