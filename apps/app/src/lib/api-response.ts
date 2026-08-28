import { checkRateLimit, type RateLimitOptions } from "@/lib/api-rate-limit";

/** Standard envelope error shape returned by every `/api/v1/*` route. */
export type ApiErrorBody = {
  error: { message: string };
};

function withHeaders(response: Response, headers: Record<string, string>): Response {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/** JSON success response, tagged with the given rate-limit headers. */
export function apiJson<T>(
  data: T,
  rateLimitHeaders: Record<string, string>,
  init?: { status?: number },
): Response {
  const response = Response.json(data, { status: init?.status ?? 200 });
  return withHeaders(response, rateLimitHeaders);
}

/** `{ error: { message } }` JSON response, tagged with the given rate-limit headers. */
export function apiError(
  message: string,
  status: number,
  rateLimitHeaders: Record<string, string>,
): Response {
  const body: ApiErrorBody = { error: { message } };
  const response = Response.json(body, { status });
  return withHeaders(response, rateLimitHeaders);
}

/**
 * Applies the shared `/api/v1/*` rate limit and returns the 429 response to
 * send immediately when it's exceeded, or `undefined` (with the headers to
 * attach to whatever response the route ends up sending) when it isn't.
 */
export function enforceRateLimit(
  request: Request,
  scope: string,
  options?: RateLimitOptions,
): { blocked: Response } | { blocked: undefined; headers: Record<string, string> } {
  const result = checkRateLimit(request, scope, options);

  if (result.limited) {
    const headers = { ...result.headers, "Retry-After": String(result.retryAfterSeconds) };
    return { blocked: apiError("Rate limit exceeded.", 429, headers) };
  }

  return { blocked: undefined, headers: result.headers };
}
