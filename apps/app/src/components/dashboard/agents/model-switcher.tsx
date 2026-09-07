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
import { apiFetch } from "@/lib/api-client";

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

  const providers = [...new Set(models.map((m) => m.provider))];

  const handleSelect = async (nextId: string) => {
    setOpen(false);
    const previousModel = model;
    setModel(nextId);

    try {
      await apiFetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        body: JSON.stringify({ model: nextId }),
      });
    } catch (err) {
      setModel(previousModel);
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.add({ type: "error", title: "Couldn't switch model", description: message });
    }
  };

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger
        render={<Button className="w-full justify-between" size="sm" variant="outline" />}
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
