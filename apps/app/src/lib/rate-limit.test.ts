import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}));

const limitMock = vi.fn();
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn((...args: unknown[]) => ({ args }));
    limit = limitMock;
  },
}));

const { checkChatRateLimit } = await import("./rate-limit");

beforeEach(() => {
  limitMock.mockReset();
});

describe("checkChatRateLimit", () => {
  it("allows a request under the limit", async () => {
    limitMock.mockResolvedValue({ success: true, reset: 1234 });
    await expect(checkChatRateLimit("1.2.3.4", "agent-1")).resolves.toEqual({
      success: true,
      retryAt: undefined,
    });
  });

  it("blocks a request over the limit and surfaces exactly when the window resets", async () => {
    limitMock.mockResolvedValue({ success: false, reset: 1735699200000 });
    await expect(checkChatRateLimit("1.2.3.4", "agent-1")).resolves.toEqual({
      success: false,
      retryAt: 1735699200000,
    });
  });

  it("keys the limit by ip and agentId together, so either changing gets a fresh bucket", async () => {
    limitMock.mockResolvedValue({ success: true, reset: 1234 });

    await checkChatRateLimit("1.2.3.4", "agent-1");
    await checkChatRateLimit("5.6.7.8", "agent-1");
    await checkChatRateLimit("1.2.3.4", "agent-2");

    expect(limitMock).toHaveBeenNthCalledWith(1, "1.2.3.4:agent-1");
    expect(limitMock).toHaveBeenNthCalledWith(2, "5.6.7.8:agent-1");
    expect(limitMock).toHaveBeenNthCalledWith(3, "1.2.3.4:agent-2");
  });
});
