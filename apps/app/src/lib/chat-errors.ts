export const RATE_LIMIT_MESSAGE =
  "This agent is getting a lot of messages right now. Please wait a moment and try again.";

export function isRateLimitError(error: unknown, depth = 0): boolean {
  if (depth > 5 || !error || typeof error !== "object") return false;

  const err = error as Record<string, unknown>;
  if (err.statusCode === 429) return true;
  if (Array.isArray(err.errors) && err.errors.some((e) => isRateLimitError(e, depth + 1))) {
    return true;
  }

  return isRateLimitError(err.lastError, depth + 1) || isRateLimitError(err.cause, depth + 1);
}
