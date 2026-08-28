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

/**
 * Fully controlled - wired up to react-hook-form by ModelField
 * (model-field.tsx), not a native <select>. Base UI's Select passes the
 * raw value straight to onValueChange (no event object), which is exactly
 * the shape field.onChange expects.
 */
export function ModelSelect({
  models,
  value,
  onValueChange,
  onBlur,
}: {
  models: GatewayChatModel[];
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const groups = groupByProvider(models);
  // Lets <SelectValue> show the model's display name in the trigger
  // instead of its raw gateway id.
  const items = Object.fromEntries(models.map((model) => [model.id, model.name]));

  return (
    <Select
      value={value}
      // The Select wrapper's Root.Props<unknown> erases the item type, so
      // the callback must accept unknown at this boundary - every item's
      // value is one of this component's own string model ids either way.
      onValueChange={(next: unknown) => onValueChange(next as string)}
      onOpenChange={(open) => {
        if (!open) onBlur?.();
      }}
      items={items}
    >
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
