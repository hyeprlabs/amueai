"use client";

import { useState } from "react";
import { SparklesIcon } from "lucide-react";

import {
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input";
import { ProviderIcon } from "@/components/icons/provider-icons";
import { toast } from "@/components/ui/toast";
import { AUTO_MODEL_ID } from "@/lib/model-picker";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { updateAgent } from "../../actions";

/**
 * The model this agent answers with, switched live from right inside the
 * Playground's chat composer - the AI Elements prompt-input select, the
 * same pattern ChatGPT/Claude use for an inline model picker. There's no
 * separate save step: every request to /api/chat/[agentId] reads the
 * agent's model fresh from the database, so persisting the change here is
 * exactly what makes the very next test message use it.
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
  const [model, setModel] = useState(defaultModel);
  const items = {
    [AUTO_MODEL_ID]: "Auto",
    ...Object.fromEntries(models.map((m) => [m.id, m.name])),
  };
  const modelsById = Object.fromEntries(models.map((m) => [m.id, m]));

  const handleChange = async (next: unknown) => {
    const nextModel = next as string;
    const previousModel = model;
    setModel(nextModel);

    try {
      await updateAgent(agentId, { model: nextModel });
    } catch (err) {
      setModel(previousModel);
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.add({ type: "error", title: "Couldn't switch model", description: message });
    }
  };

  return (
    <PromptInputSelect value={model} onValueChange={handleChange} items={items}>
      <PromptInputSelectTrigger>
        <PromptInputSelectValue placeholder="Select a model">
          {(value: string) => {
            if (value === AUTO_MODEL_ID) {
              return (
                <span className="flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 shrink-0 text-pink-500" />
                  Auto
                </span>
              );
            }
            const selected = modelsById[value];
            return selected ? (
              <span className="flex items-center gap-1.5">
                <ProviderIcon provider={selected.provider} className="size-3.5 shrink-0" />
                {selected.name}
              </span>
            ) : (
              value
            );
          }}
        </PromptInputSelectValue>
      </PromptInputSelectTrigger>
      <PromptInputSelectContent>
        <PromptInputSelectItem value={AUTO_MODEL_ID}>
          <SparklesIcon className="size-3.5 shrink-0 text-pink-500" />
          Auto
        </PromptInputSelectItem>
        {models.map((m) => (
          <PromptInputSelectItem key={m.id} value={m.id}>
            <ProviderIcon provider={m.provider} className="size-3.5 shrink-0" />
            {m.name}
          </PromptInputSelectItem>
        ))}
      </PromptInputSelectContent>
    </PromptInputSelect>
  );
}
