"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { CHAT_MODELS } from "@/lib/models";

export function ModelSwitcher({
  agentId,
  defaultModel,
}: {
  agentId: string;
  defaultModel: string;
}) {
  const [model, setModel] = useState(defaultModel);

  const handleSelect = async (nextId: string | null) => {
    if (!nextId) return;
    const previousModel = model;
    setModel(nextId);

    try {
      await apiFetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        body: JSON.stringify({ model: nextId }),
      });
    } catch {
      setModel(previousModel);
      toast.add({ type: "error", title: "Couldn't switch model" });
    }
  };

  return (
    <Select onValueChange={handleSelect} value={model}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHAT_MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
