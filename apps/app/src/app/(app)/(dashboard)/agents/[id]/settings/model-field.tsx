"use client";

import { useController, type Control } from "react-hook-form";

import type { GatewayChatModel } from "@/lib/gateway-models";
import type { AgentSettingsValues } from "./agent-settings-schema";
import { ModelSelect } from "./model-select";

/**
 * The useController subscription lives in this dedicated child component
 * rather than inlined in AgentSettingsForm, so a model change only
 * re-renders this field, not the whole form (react-hook-form skill:
 * ctrl-usecontroller-isolation).
 */
export function ModelField({
  control,
  models,
}: {
  control: Control<AgentSettingsValues>;
  models: GatewayChatModel[];
}) {
  const { field } = useController({ name: "model", control });

  return (
    <ModelSelect
      models={models}
      value={field.value}
      onValueChange={field.onChange}
      onBlur={field.onBlur}
    />
  );
}
