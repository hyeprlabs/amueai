"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GatewayChatModel } from "@/lib/gateway-models";

/** Groups a flat, provider-sorted model list into one group per provider. */
function groupByProvider(models: GatewayChatModel[]) {
  const groups: { provider: string; models: GatewayChatModel[] }[] = [];
  for (const model of models) {
    const group = groups.at(-1);
    if (group?.provider === model.provider) {
      group.models.push(model);
    } else {
      groups.push({ provider: model.provider, models: [model] });
    }
  }
  return groups;
}

export function ModelSelect({
  models,
  defaultValue,
}: {
  models: GatewayChatModel[];
  defaultValue: string;
}) {
  const groups = groupByProvider(models);
  // Lets <SelectValue> show the model's display name in the trigger
  // instead of its raw gateway id.
  const items = Object.fromEntries(models.map((model) => [model.id, model.name]));

  return (
    <Select name="model" defaultValue={defaultValue} items={items}>
      <SelectTrigger id="model" className="w-full">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectGroup key={group.provider}>
            <SelectLabel className="capitalize">{group.provider}</SelectLabel>
            {group.models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
