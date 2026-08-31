import { describe, expect, it } from "vitest";

import { isRateLimitError } from "./chat-errors";

describe("isRateLimitError", () => {
  it("returns false for a plain error", () => {
    expect(isRateLimitError(new Error("boom"))).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
    expect(isRateLimitError("boom")).toBe(false);
  });

  it("detects a top-level statusCode of 429", () => {
    expect(isRateLimitError({ statusCode: 429 })).toBe(true);
    expect(isRateLimitError({ statusCode: 500 })).toBe(false);
  });

  it("detects a 429 nested inside an AI_RetryError's errors array", () => {
    // Matches the real shape thrown when the Gateway rate-limits every
    // retry attempt: an AI_RetryError wrapping several GatewayRateLimitError
    // instances via `.errors`.
    const retryError = {
      name: "AI_RetryError",
      reason: "maxRetriesExceeded",
      errors: [
        { name: "GatewayRateLimitError", statusCode: 429 },
        { name: "GatewayRateLimitError", statusCode: 429 },
      ],
      lastError: { name: "GatewayRateLimitError", statusCode: 429 },
    };
    expect(isRateLimitError(retryError)).toBe(true);
  });

  it("detects a 429 nested inside lastError.cause", () => {
    const wrapped = {
      lastError: {
        statusCode: 429,
        cause: { name: "AI_APICallError", statusCode: 429 },
      },
    };
    expect(isRateLimitError(wrapped)).toBe(true);
  });

  it("does not false-positive on an unrelated nested error", () => {
    const retryError = {
      reason: "maxRetriesExceeded",
      errors: [{ statusCode: 500 }, { statusCode: 503 }],
      lastError: { statusCode: 503 },
    };
    expect(isRateLimitError(retryError)).toBe(false);
  });

  it("does not infinite-loop on a circular reference", () => {
    const circular: Record<string, unknown> = { statusCode: 500 };
    circular.cause = circular;
    expect(() => isRateLimitError(circular)).not.toThrow();
    expect(isRateLimitError(circular)).toBe(false);
  });
});
