"use client";

import { useState } from "react";
import { ChevronsUpDownIcon, SparklesIcon } from "lucide-react";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AUTO_MODEL_ID } from "@/lib/model-picker";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { updateAgent } from "../../actions";

/**
 * Best-effort human label for a Gateway provider id ("google-vertex" ->
 * "Google Vertex") used as this component's group headings. The known
 * brands get their real casing; anything else falls back to a generic
 * title-case of the hyphenated slug.
 */
const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  "google-vertex": "Google",
  meta: "Meta",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  amazon: "Amazon",
  "amazon-bedrock": "Amazon",
  perplexity: "Perplexity",
  alibaba: "Alibaba",
};

function providerLabel(provider: string): string {
  return (
    PROVIDER_LABELS[provider] ??
    provider
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/**
 * The model this agent answers with, switched live from right inside the
 * Playground's chat composer - the AI Elements Model Selector (the same
 * searchable command-palette pattern as its own docs example), wired to
 * this app's real AI Gateway catalog instead of the docs' hardcoded list.
 * Brand marks come straight from models.dev (ModelSelectorLogo's own
 * built-in source) keyed by the Gateway's own provider id - no bespoke
 * icon set to maintain.
 *
 * There's no separate save step: every request to /api/chat/[agentId]
 * reads the agent's model fresh from the database, so persisting the
 * change here is exactly what makes the very next test message use it.
 *
 * The list itself is already restricted to the AI Gateway's cheap tier by
 * getGatewayChatModels - nothing here re-filters by price.
 */
export function ModelSwitcher({
  agentId,
  models,
  defaultModel,
}: {
  agentId: string;
  models: GatewayChatModel[];
  defaultModel: string;
}) {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(defaultModel);
  const selected = models.find((m) => m.id === model);

  // Providers in order of first appearance, so each renders as one group.
  const providers = [...new Set(models.map((m) => m.provider))];

  const handleSelect = async (nextId: string) => {
    setOpen(false);
    const previousModel = model;
    setModel(nextId);

    try {
      await updateAgent(agentId, { model: nextId });
    } catch (err) {
      setModel(previousModel);
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.add({ type: "error", title: "Couldn't switch model", description: message });
    }
  };

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger
        render={<Button className="w-56 justify-between" size="sm" variant="outline" />}
      >
        {model === AUTO_MODEL_ID ? (
          <SparklesIcon className="size-4 shrink-0 text-pink-500" />
        ) : selected ? (
          <ModelSelectorLogo provider={selected.provider} />
        ) : null}
        <ModelSelectorName>
          {model === AUTO_MODEL_ID ? "Auto" : (selected?.name ?? model)}
        </ModelSelectorName>
        <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </ModelSelectorTrigger>
      <ModelSelectorContent title="Select a model">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          <ModelSelectorGroup heading="Auto">
            <ModelSelectorItem
              data-checked={model === AUTO_MODEL_ID}
              onSelect={() => handleSelect(AUTO_MODEL_ID)}
              value={AUTO_MODEL_ID}
            >
              <SparklesIcon className="size-4 shrink-0 text-pink-500" />
              <ModelSelectorName>Auto</ModelSelectorName>
            </ModelSelectorItem>
          </ModelSelectorGroup>
          {providers.map((provider) => (
            <ModelSelectorGroup heading={providerLabel(provider)} key={provider}>
              {models
                .filter((m) => m.provider === provider)
                .map((m) => (
                  <ModelSelectorItem
                    data-checked={model === m.id}
                    key={m.id}
                    onSelect={() => handleSelect(m.id)}
                    value={m.id}
                  >
                    <ModelSelectorLogo provider={m.provider} />
                    <ModelSelectorName>{m.name}</ModelSelectorName>
                  </ModelSelectorItem>
                ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
