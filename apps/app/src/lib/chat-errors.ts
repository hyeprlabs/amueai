export const RATE_LIMIT_MESSAGE =
  "This agent is getting a lot of messages right now. Please wait a moment and try again.";

const RETRY_AT_MARKER = "␟";

export function encodeRateLimitMessage(retryAt?: number): string {
  return retryAt ? `${RATE_LIMIT_MESSAGE}${RETRY_AT_MARKER}${retryAt}` : RATE_LIMIT_MESSAGE;
}

export function decodeRateLimitMessage(message: string): { text: string; retryAt?: number } {
  const markerIndex = message.indexOf(RETRY_AT_MARKER);
  if (markerIndex === -1) return { text: message };

  const text = message.slice(0, markerIndex);
  const retryAt = Number(message.slice(markerIndex + 1));
  return { text, retryAt: Number.isFinite(retryAt) ? retryAt : undefined };
}

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
