// Shared between the chat route (server) and ChatPanel (client) - no
// "server-only" import here, unlike lib/rate-limit.ts, since ChatPanel
// needs this exact string to recognize a rate-limit failure and render it
// differently from a generic one.
export const RATE_LIMIT_MESSAGE =
  "This agent is getting a lot of messages right now. Please wait a moment and try again.";

/**
 * Walks an error's `errors`/`lastError`/`cause` chain looking for a 429
 * anywhere in it. Needed because a Gateway rate limit doesn't surface as a
 * clean top-level error: streamText retries it a few times and then throws
 * an AI_RetryError wrapping several GatewayRateLimitError instances, each
 * nested inside an AI_APICallError - none of which are exported classes we
 * can just `instanceof` check, so this reads the shape defensively instead.
 */
export function isRateLimitError(error: unknown, depth = 0): boolean {
  if (depth > 5 || !error || typeof error !== "object") return false;

  const err = error as Record<string, unknown>;
  if (err.statusCode === 429) return true;

  if (Array.isArray(err.errors) && err.errors.some((e) => isRateLimitError(e, depth + 1))) {
    return true;
  }
  if (isRateLimitError(err.lastError, depth + 1)) return true;
  if (isRateLimitError(err.cause, depth + 1)) return true;

  return false;
}
