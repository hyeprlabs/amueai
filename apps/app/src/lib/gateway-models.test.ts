import { beforeEach, describe, expect, it, vi } from "vitest";

const getAvailableModelsMock = vi.fn();
vi.mock("ai", () => ({
  gateway: { getAvailableModels: (...args: unknown[]) => getAvailableModelsMock(...args) },
}));

/** Defaults to a cheap-tier price so tests unconcerned with pricing don't need to think about it. */
function languageModel(
  id: string,
  name: string,
  provider: string,
  pricing: { input: string; output: string } | null = { input: "0.00000015", output: "0.0000006" },
) {
  return { id, name, modelType: "language", specification: { provider }, pricing };
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
        languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
        languageModel("anthropic/claude-haiku", "Claude Haiku", "anthropic"),
        languageModel("openai/gpt-4o-nano", "GPT-4o nano", "openai"),
        languageModel("anthropic/claude-instant", "Claude Instant", "anthropic"),
      ],
    });

    const { getGatewayChatModels } = await import("./gateway-models");
    const models = await getGatewayChatModels();

    expect(models.map((m) => m.id)).toEqual([
      "anthropic/claude-haiku",
      "anthropic/claude-instant",
      "openai/gpt-4o-mini",
      "openai/gpt-4o-nano",
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

  describe("cost cap - only the cheap tier is offered while there's no usage billing", () => {
    it("excludes a flagship model priced above the input cap", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
          // $2.50/1M input - a real gpt-4o-class price, over the $1 cap.
          languageModel("openai/gpt-4o", "GPT-4o", "openai", {
            input: "0.0000025",
            output: "0.00001",
          }),
        ],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models.map((m) => m.id)).toEqual(["openai/gpt-4o-mini"]);
    });

    it("excludes a model priced above the output cap even with cheap input", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          // A reasoning-style model: cheap input, expensive output.
          languageModel("openai/o1-mini", "o1-mini", "openai", {
            input: "0.0000003",
            output: "0.000012",
          }),
        ],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models).toEqual([]);
    });

    it("includes a model priced exactly at the caps", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          languageModel("acme/on-the-line", "On The Line", "acme", {
            input: "0.000001",
            output: "0.000005",
          }),
        ],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models.map((m) => m.id)).toEqual(["acme/on-the-line"]);
    });

    it("excludes a model with no pricing info rather than assume it's cheap", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [languageModel("mystery/model", "Mystery Model", "mystery", null)],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models).toEqual([]);
    });
  });
});
