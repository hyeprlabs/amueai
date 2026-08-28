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
 * Every chat-capable model currently routable through the AI Gateway, for
 * populating the model picker and validating a submitted model id server
 * side. Cached in-memory for a few minutes — the catalog changes rarely,
 * and this gets called on every agent settings page render.
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
    .filter((model) => model.modelType === "language")
    .map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.specification.provider,
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

  cache = { models: chatModels, expiresAt: Date.now() + CACHE_TTL_MS };
  return chatModels;
}
