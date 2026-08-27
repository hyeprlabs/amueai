"use client";

import { useMemo } from "react";

import { ChatPanel } from "@/components/chat-panel";

export function TestChat({ agentId }: { agentId: string }) {
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const visitorId = useMemo(() => `dashboard-test-${crypto.randomUUID()}`, []);

  return (
    <div className="h-[32rem] rounded-lg border">
      <ChatPanel agentId={agentId} conversationId={conversationId} visitorId={visitorId} />
    </div>
  );
}
