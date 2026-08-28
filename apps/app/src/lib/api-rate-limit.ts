/**
 * Fixed-window rate limiter for the public `/api/v1/*` routes.
 *
 * In-memory and per-instance: on a single long-lived server this enforces a
 * real limit; on a multi-instance serverless deployment each instance keeps
 * its own counters, so the effective ceiling scales with instance count.
 * That's an accepted tradeoff to ship real `RateLimit-*` / `Retry-After`
 * headers without a new datastore dependency (e.g. Upstash Redis) — swap
 * this for a shared-store limiter if the API needs a hard global cap.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 60;

/** Bounds memory use: buckets are cheap, but a long-running instance under
 * sustained abuse from many distinct IPs shouldn't grow this without limit. */
const MAX_TRACKED_KEYS = 50_000;

export type RateLimitOptions = {
  /** Requests allowed per window. */
  limit?: number;
  /** Window length in milliseconds. */
  windowMs?: number;
};

export type RateLimitResult = {
  limited: boolean;
  /** `RateLimit-*` headers to attach to every response, limited or not. */
  headers: Record<string, string>;
  /** Only set when `limited` is true — seconds until the window resets. */
  retryAfterSeconds?: number;
};

function clientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip;
}

/** Checks and records one request against `scope`'s bucket for this client. */
export function checkRateLimit(
  request: Request,
  scope: string,
  { limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS }: RateLimitOptions = {},
): RateLimitResult {
  const key = `${scope}:${clientKey(request)}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (!bucket && buckets.size >= MAX_TRACKED_KEYS) {
      buckets.clear();
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));

  const headers = {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
  };

  if (bucket.count > limit) {
    return { limited: true, headers, retryAfterSeconds: resetSeconds };
  }

  return { limited: false, headers };
}

/** Clears all tracked buckets. Test-only. */
export function resetRateLimitState(): void {
  buckets.clear();
}
