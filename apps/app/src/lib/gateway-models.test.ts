import { beforeEach, describe, expect, it, vi } from "vitest";

const getAvailableModelsMock = vi.fn();
vi.mock("ai", () => ({
  gateway: { getAvailableModels: (...args: unknown[]) => getAvailableModelsMock(...args) },
}));

function languageModel(id: string, name: string, provider: string) {
  return { id, name, modelType: "language", specification: { provider } };
}

beforeEach(() => {
  getAvailableModelsMock.mockReset();
  vi.resetModules();
  vi.useRealTimers();
});

describe("getGatewayChatModels", () => {
  it("filters out non-language models", async () => {
    getAvailableModelsMock.mockResolvedValue({
      models: [
        languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
        { id: "openai/text-embedding-3-small", name: "Embedding", modelType: "embedding" },
        { id: "openai/dall-e-3", name: "DALL-E 3", modelType: "image" },
      ],
    });

    const { getGatewayChatModels } = await import("./gateway-models");
    const models = await getGatewayChatModels();

    expect(models).toEqual([{ id: "openai/gpt-4o-mini", name: "GPT-4o mini", provider: "openai" }]);
  });

  it("sorts by provider, then by name within a provider", async () => {
    getAvailableModelsMock.mockResolvedValue({
      models: [
        languageModel("openai/gpt-4o", "GPT-4o", "openai"),
        languageModel("anthropic/claude-haiku", "Claude Haiku", "anthropic"),
        languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
        languageModel("anthropic/claude-opus", "Claude Opus", "anthropic"),
      ],
    });

    const { getGatewayChatModels } = await import("./gateway-models");
    const models = await getGatewayChatModels();

    expect(models.map((m) => m.id)).toEqual([
      "anthropic/claude-haiku",
      "anthropic/claude-opus",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
    ]);
  });

  it("caches results across calls instead of refetching every time", async () => {
    getAvailableModelsMock.mockResolvedValue({
      models: [languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai")],
    });

    const { getGatewayChatModels } = await import("./gateway-models");
    await getGatewayChatModels();
    await getGatewayChatModels();
    await getGatewayChatModels();

    expect(getAvailableModelsMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cache TTL has elapsed", async () => {
    vi.useFakeTimers();
    getAvailableModelsMock.mockResolvedValue({
      models: [languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai")],
    });

    const { getGatewayChatModels } = await import("./gateway-models");
    await getGatewayChatModels();
    expect(getAvailableModelsMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    await getGatewayChatModels();
    expect(getAvailableModelsMock).toHaveBeenCalledTimes(2);
  });

  it("returns an empty list instead of throwing when the Gateway call fails", async () => {
    getAvailableModelsMock.mockRejectedValue(new Error("Gateway unavailable"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { getGatewayChatModels } = await import("./gateway-models");
    const models = await getGatewayChatModels();

    expect(models).toEqual([]);
    consoleErrorSpy.mockRestore();
  });
});
