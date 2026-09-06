// Shared between the chat route (server) and ChatPanel (client) - no
// "server-only" import here, unlike lib/rate-limit.ts, since ChatPanel
// needs this exact string to recognize a rate-limit failure and render it
// differently from a generic one.
export const RATE_LIMIT_MESSAGE =
  "This agent is getting a lot of messages right now. Please wait a moment and try again.";

// AI SDK errors only ever reach the client as a plain string (the `error`
// on useChat has nothing beyond `.message`), so a retry time - when we
// actually know one - rides along as an invisible suffix on that same
// string rather than needing a separate data channel. U+241F is a
// control-picture character no real message would ever contain, so a
// naive display of an undecoded string still reads fine.
const RETRY_AT_MARKER = "␟";

/**
 * Appends an exact "you can retry at this unix-ms timestamp" marker to a
 * rate-limit message, when the caller actually knows one - which is only
 * true for our own Upstash-based limiter (a real sliding window with a
 * known reset time). A Gateway/provider-side "free tier" rate limit has no
 * such schedule, so callers that hit that path pass no retryAt and the
 * message goes out plain.
 */
export function encodeRateLimitMessage(retryAt?: number): string {
  return retryAt ? `${RATE_LIMIT_MESSAGE}${RETRY_AT_MARKER}${retryAt}` : RATE_LIMIT_MESSAGE;
}

/**
 * Splits a message produced by encodeRateLimitMessage back into the
 * display text and the retry timestamp, if one was encoded. Safe to call
 * on any string - a message with no marker just returns retryAt: undefined.
 */
export function decodeRateLimitMessage(message: string): { text: string; retryAt?: number } {
  const markerIndex = message.indexOf(RETRY_AT_MARKER);
  if (markerIndex === -1) return { text: message };

  const text = message.slice(0, markerIndex);
  const retryAt = Number(message.slice(markerIndex + 1));
  return { text, retryAt: Number.isFinite(retryAt) ? retryAt : undefined };
}

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
