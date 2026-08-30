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

  const chatModels = models
    .filter((model) => model.modelType === "language" && isAffordable(model.pricing))
    .map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.specification.provider,
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

  cache = { models: chatModels, expiresAt: Date.now() + CACHE_TTL_MS };
  return chatModels;
}
