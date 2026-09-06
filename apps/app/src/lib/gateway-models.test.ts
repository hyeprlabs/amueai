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

  describe("top 5 - no usage data to rank by, so a curated popular-family list stands in", () => {
    it("caps the list at 5 even when more affordable models exist", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
          languageModel("anthropic/claude-3-5-haiku", "Claude 3.5 Haiku", "anthropic"),
          languageModel("google/gemini-2.0-flash", "Gemini 2.0 Flash", "google"),
          languageModel("deepseek/deepseek-chat", "DeepSeek Chat", "deepseek"),
          languageModel("mistral/mistral-small", "Mistral Small", "mistral"),
          languageModel("acme/random-model", "Random Model", "acme"),
          languageModel("acme/another-model", "Another Model", "acme"),
        ],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models).toHaveLength(5);
    });

    it("prefers one match per popular family over other affordable models once the quota is full", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
          languageModel("anthropic/claude-3-5-haiku", "Claude 3.5 Haiku", "anthropic"),
          languageModel("google/gemini-2.0-flash", "Gemini 2.0 Flash", "google"),
          languageModel("deepseek/deepseek-chat", "DeepSeek Chat", "deepseek"),
          languageModel("mistral/mistral-small", "Mistral Small", "mistral"),
          // Not part of any popular family - only relevant as filler, and
          // the quota is already full without it.
          languageModel("acme/random-model", "Random Model", "acme"),
        ],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models.map((m) => m.id)).toEqual([
        "anthropic/claude-3-5-haiku",
        "deepseek/deepseek-chat",
        "google/gemini-2.0-flash",
        "mistral/mistral-small",
        "openai/gpt-4o-mini",
      ]);
    });

    it("fills remaining slots with the cheapest leftover models when fewer than 5 families match", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          languageModel("openai/gpt-4o-mini", "GPT-4o mini", "openai"),
          languageModel("anthropic/claude-3-5-haiku", "Claude 3.5 Haiku", "anthropic"),
          languageModel("acme/pricier-filler", "Pricier Filler", "acme", {
            input: "0.0000008",
            output: "0.000004",
          }),
          languageModel("acme/cheaper-filler", "Cheaper Filler", "acme", {
            input: "0.0000001",
            output: "0.0000005",
          }),
          languageModel("acme/cheapest-filler", "Cheapest Filler", "acme", {
            input: "0.00000005",
            output: "0.0000002",
          }),
          // Would be the 4th filler, but only 3 slots remain after the 2
          // family matches - the priciest filler loses out.
          languageModel("acme/excluded-filler", "Excluded Filler", "acme", {
            input: "0.0000009",
            output: "0.0000045",
          }),
        ],
      });

      const { getGatewayChatModels } = await import("./gateway-models");
      const models = await getGatewayChatModels();

      expect(models.map((m) => m.id)).toEqual([
        "acme/cheaper-filler",
        "acme/cheapest-filler",
        "acme/pricier-filler",
        "anthropic/claude-3-5-haiku",
        "openai/gpt-4o-mini",
      ]);
    });
  });

  describe("resolveAutoModelId", () => {
    it("picks the offered model ranking highest by popularity, not just the first alphabetically", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          // Alphabetically first, but the anthropic haiku pattern outranks it.
          languageModel("acme/aardvark", "Aardvark", "acme"),
          languageModel("anthropic/claude-3-5-haiku", "Claude 3.5 Haiku", "anthropic"),
        ],
      });

      const { resolveAutoModelId } = await import("./gateway-models");
      expect(await resolveAutoModelId()).toBe("anthropic/claude-3-5-haiku");
    });

    it("falls back to the first offered model when none match a popularity pattern", async () => {
      getAvailableModelsMock.mockResolvedValue({
        models: [
          languageModel("acme/aardvark", "Aardvark", "acme"),
          languageModel("acme/zebra", "Zebra", "acme"),
        ],
      });

      const { resolveAutoModelId } = await import("./gateway-models");
      expect(await resolveAutoModelId()).toBe("acme/aardvark");
    });

    it("resolves to undefined when the Gateway list is empty", async () => {
      getAvailableModelsMock.mockRejectedValue(new Error("Gateway unavailable"));
      vi.spyOn(console, "error").mockImplementation(() => {});

      const { resolveAutoModelId } = await import("./gateway-models");
      expect(await resolveAutoModelId()).toBeUndefined();
    });
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
