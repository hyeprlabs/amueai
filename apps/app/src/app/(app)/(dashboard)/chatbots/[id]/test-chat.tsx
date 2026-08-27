"use client";

import { useMemo } from "react";

import { ChatPanel } from "@/components/chat-panel";

export function TestChat({ chatbotId }: { chatbotId: string }) {
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const visitorId = useMemo(() => `dashboard-test-${crypto.randomUUID()}`, []);

  return (
    <div className="h-[32rem] rounded-lg border">
      <ChatPanel chatbotId={chatbotId} conversationId={conversationId} visitorId={visitorId} />
    </div>
  );
}
