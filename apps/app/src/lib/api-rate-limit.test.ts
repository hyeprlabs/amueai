import { afterEach, describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimitState } from "@/lib/api-rate-limit";

function requestFrom(ip: string): Request {
  return new Request("https://example.com/api/v1/posts", {
    headers: { "x-forwarded-for": ip },
  });
}

afterEach(() => {
  resetRateLimitState();
});

describe("checkRateLimit", () => {
  it("allows requests under the limit and reports remaining count", () => {
    const request = requestFrom("203.0.113.1");

    const first = checkRateLimit(request, "test-scope", { limit: 3, windowMs: 60_000 });
    expect(first.limited).toBe(false);
    expect(first.headers["RateLimit-Limit"]).toBe("3");
    expect(first.headers["RateLimit-Remaining"]).toBe("2");

    const second = checkRateLimit(request, "test-scope", { limit: 3, windowMs: 60_000 });
    expect(second.headers["RateLimit-Remaining"]).toBe("1");
  });

  it("blocks once the limit is exceeded and reports Retry-After seconds", () => {
    const request = requestFrom("203.0.113.2");
    const options = { limit: 2, windowMs: 60_000 };

    checkRateLimit(request, "test-scope", options);
    checkRateLimit(request, "test-scope", options);
    const third = checkRateLimit(request, "test-scope", options);

    expect(third.limited).toBe(true);
    expect(third.headers["RateLimit-Remaining"]).toBe("0");
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate clients independently", () => {
    const options = { limit: 1, windowMs: 60_000 };

    const clientA = checkRateLimit(requestFrom("203.0.113.3"), "test-scope", options);
    const clientB = checkRateLimit(requestFrom("203.0.113.4"), "test-scope", options);

    expect(clientA.limited).toBe(false);
    expect(clientB.limited).toBe(false);
  });

  it("tracks separate scopes independently for the same client", () => {
    const request = requestFrom("203.0.113.5");
    const options = { limit: 1, windowMs: 60_000 };

    const scopeA = checkRateLimit(request, "scope-a", options);
    const scopeB = checkRateLimit(request, "scope-b", options);

    expect(scopeA.limited).toBe(false);
    expect(scopeB.limited).toBe(false);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = new Request("https://example.com/api/v1/posts", {
      headers: { "x-real-ip": "203.0.113.6" },
    });
    const options = { limit: 1, windowMs: 60_000 };

    const first = checkRateLimit(request, "test-scope", options);
    const second = checkRateLimit(request, "test-scope", options);

    expect(first.limited).toBe(false);
    expect(second.limited).toBe(true);
  });
});
