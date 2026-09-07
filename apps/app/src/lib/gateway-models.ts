import "server-only";

import { gateway } from "ai";

export { AUTO_MODEL_ID } from "@/lib/model-picker";

export type GatewayChatModel = {
  id: string;
  name: string;
  provider: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { models: GatewayChatModel[]; expiresAt: number } | undefined;

const MAX_INPUT_PRICE_PER_MILLION_TOKENS = 1;
const MAX_OUTPUT_PRICE_PER_MILLION_TOKENS = 5;

function isAffordable(pricing: { input: string; output: string } | null | undefined): boolean {
  if (!pricing) return false;

  const inputPerMillion = Number(pricing.input) * 1_000_000;
  const outputPerMillion = Number(pricing.output) * 1_000_000;
  if (!Number.isFinite(inputPerMillion) || !Number.isFinite(outputPerMillion)) return false;

  return (
    inputPerMillion <= MAX_INPUT_PRICE_PER_MILLION_TOKENS &&
    outputPerMillion <= MAX_OUTPUT_PRICE_PER_MILLION_TOKENS
  );
}

const MAX_MODELS_OFFERED = 5;

const POPULAR_CHEAP_MODEL_PATTERNS: RegExp[] = [
  /^openai\/gpt-4[o.]/i,
  /^anthropic\/claude-.*haiku/i,
  /^google\/gemini-.*flash/i,
  /^deepseek\//i,
  /^(meta|mistral)\//i,
];

function pickTopModels(
  models: GatewayChatModel[],
  pricingById: Map<string, { input: string; output: string }>,
): GatewayChatModel[] {
  const remaining = new Set(models);
  const picked: GatewayChatModel[] = [];

  for (const pattern of POPULAR_CHEAP_MODEL_PATTERNS) {
    if (picked.length >= MAX_MODELS_OFFERED) break;
    const match = models.find((model) => remaining.has(model) && pattern.test(model.id));
    if (match) {
      picked.push(match);
      remaining.delete(match);
    }
  }

  if (picked.length < MAX_MODELS_OFFERED) {
    const byPrice = (model: GatewayChatModel) => {
      const pricing = pricingById.get(model.id);
      return Number(pricing?.input) + Number(pricing?.output);
    };
    const cheapestRemaining = [...remaining].sort((a, b) => byPrice(a) - byPrice(b));
    picked.push(...cheapestRemaining.slice(0, MAX_MODELS_OFFERED - picked.length));
  }

  return picked;
}

export async function getGatewayChatModels(): Promise<GatewayChatModel[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.models;

  let models: Awaited<ReturnType<typeof gateway.getAvailableModels>>["models"];
  try {
    ({ models } = await gateway.getAvailableModels());
  } catch (err) {
    console.error("Failed to fetch AI Gateway model list", err);
    return [];
  }

  const affordable = models.filter(
    (model) => model.modelType === "language" && isAffordable(model.pricing),
  );
  const pricingById = new Map(
    affordable.map((model) => [model.id, model.pricing as { input: string; output: string }]),
  );

  const byProviderThenName = (a: GatewayChatModel, b: GatewayChatModel) =>
    a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name);

  const chatModels = pickTopModels(
    affordable
      .map((model) => ({
        id: model.id,
        name: model.name,
        provider: model.specification.provider,
      }))
      .sort(byProviderThenName),
    pricingById,
    // Selection follows popularity rank, but the model switcher's Model
    // Selector groups models by provider - re-sort the final picks back to
    // provider/name order so every one of a provider's models stays
    // together instead of the popularity pass scattering them.
  ).sort(byProviderThenName);

  cache = { models: chatModels, expiresAt: Date.now() + CACHE_TTL_MS };
  return chatModels;
}

export async function resolveAutoModelId(): Promise<string | undefined> {
  const models = await getGatewayChatModels();
  const byPopularity = POPULAR_CHEAP_MODEL_PATTERNS.map((pattern) =>
    models.find((model) => pattern.test(model.id)),
  ).find((model): model is GatewayChatModel => Boolean(model));

  return byPopularity?.id ?? models[0]?.id;
}
