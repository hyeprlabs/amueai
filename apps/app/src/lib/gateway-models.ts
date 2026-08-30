import "server-only";

import { gateway } from "ai";

export type GatewayChatModel = {
  id: string;
  name: string;
  provider: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { models: GatewayChatModel[]; expiresAt: number } | undefined;

/**
 * MVP cost control: there's no usage billing yet, so an agent can only be
 * pointed at an inexpensive model - a bugged or abused agent chatting at
 * flagship-model rates could run up a real bill on the org's Gateway budget
 * before anyone notices. $1 in / $5 out per million tokens lands on the
 * "mini/flash/haiku" tier across every major provider (gpt-4o-mini,
 * gemini-2.0-flash, claude-3-5-haiku, deepseek-chat) while excluding their
 * flagship siblings (gpt-4o, gemini-pro, claude-sonnet/opus). Revisit once
 * usage limits or billing exist to police cost some other way.
 */
const MAX_INPUT_PRICE_PER_MILLION_TOKENS = 1;
const MAX_OUTPUT_PRICE_PER_MILLION_TOKENS = 5;

function isAffordable(pricing: { input: string; output: string } | null | undefined): boolean {
  // No pricing data means no way to verify it's cheap - exclude rather
  // than let an unpriced model through unchecked.
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

/**
 * The Gateway's metadata has no usage/popularity field to rank by (there's
 * no usage billing in this MVP to derive one from either), so "most used"
 * is approximated with a curated, ranked list of the cheap-tier model
 * families people actually reach for elsewhere: gpt-4o-mini-class, Claude
 * Haiku, Gemini Flash, DeepSeek, then Llama/Mistral. Matched by id prefix
 * (provider ids and naming are stable across the catalog, same approach as
 * provider-icons.tsx's brand matching) rather than an exact id, since exact
 * model slugs get superseded over time (e.g. gpt-4o-mini -> gpt-4.1-mini).
 */
const POPULAR_CHEAP_MODEL_PATTERNS: RegExp[] = [
  /^openai\/gpt-4[o.]/i,
  /^anthropic\/claude-.*haiku/i,
  /^google\/gemini-.*flash/i,
  /^deepseek\//i,
  /^(meta|mistral)\//i,
];

/**
 * Picks the top `MAX_MODELS_OFFERED` from an already-affordable, already-
 * sorted model list: one best match per popularity pattern in rank order,
 * then whichever cheapest remaining models are needed to fill out the rest
 * so the picker always offers a full set even if the catalog doesn't have
 * a hit for every pattern.
 */
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

/**
 * The cheap-tier chat-capable models currently routable through the AI
 * Gateway, for populating the model picker and validating a submitted
 * model id server side. Cached in-memory for a few minutes — the catalog
 * changes rarely, and this gets called on every agent settings page render.
 */
export async function getGatewayChatModels(): Promise<GatewayChatModel[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.models;

  // Falling back to an empty list (rather than throwing) keeps the agent
  // settings page and the update action working even if the Gateway's
  // metadata endpoint is briefly unavailable - the page still shows the
  // agent's current model as its one option, and saving other fields still
  // works since the update action accepts a resubmit of that same model.
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
    // Selection follows popularity rank, but the model switcher groups
    // consecutive same-provider entries into one header (groupByProvider in
    // model-switcher.tsx) - re-sort the final picks back to provider/name
    // order so that grouping stays correct instead of splitting a provider
    // into two headers.
  ).sort(byProviderThenName);

  cache = { models: chatModels, expiresAt: Date.now() + CACHE_TTL_MS };
  return chatModels;
}
