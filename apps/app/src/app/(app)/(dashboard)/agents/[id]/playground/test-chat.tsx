"use client";

import { useMemo } from "react";

import { ChatPanel } from "@/components/chat-panel";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { ModelSwitcher } from "./model-switcher";

export function TestChat({
  agentId,
  models,
  defaultModel,
}: {
  agentId: string;
  models: GatewayChatModel[];
  defaultModel: string;
}) {
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const visitorId = useMemo(() => `dashboard-test-${crypto.randomUUID()}`, []);

  return (
    <div className="h-[32rem] rounded-lg border">
      <ChatPanel
        agentId={agentId}
        conversationId={conversationId}
        visitorId={visitorId}
        toolbarStart={
          <ModelSwitcher agentId={agentId} models={models} defaultModel={defaultModel} />
        }
      />
    </div>
  );
}
