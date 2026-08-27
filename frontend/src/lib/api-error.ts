import axios, { AxiosError } from 'axios';

/**
 * Turns a thrown value from an API call into something worth showing a user.
 *
 * The case that matters is the one that never reached the API: axios only
 * populates `.response` when bytes actually came back, so a request killed by
 * CORS, an offline network, or a browser extension lands here with
 * `.response === undefined`. Collapsing that into the same generic string as a
 * real 4xx is what makes these bugs so hard to diagnose once deployed — the
 * message says "failed" and names no cause, so there's nothing to act on.
 *
 * `action` names the step that broke ("Registration", "Login"), so a submit
 * handler running several calls can say which one it was.
 */
export function describeApiError(err: unknown, action: string): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string | string[] }>;

    if (!axiosErr.response) {
      return `${action} failed: couldn't reach the server. Check your connection — an ad blocker or browser extension may be blocking the request.`;
    }

    // Every error our NestJS API returns carries `message` (a string, or an
    // array for class-validator failures).
    const message = axiosErr.response.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;

    // A response arrived but without that field, so it didn't come from our
    // API — most likely a proxy or CDN error page. The status is the only
    // signal left, and it's the one that distinguishes "backend is down"
    // (502/503) from anything we'd handle ourselves.
    return `${action} failed: server returned ${axiosErr.response.status}.`;
  }

  if (err instanceof Error) return `${action} failed: ${err.message}`;
  return `${action} failed.`;
}
