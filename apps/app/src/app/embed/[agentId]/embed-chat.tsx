"use client";

import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat-panel";

/** conversationId/visitorId persist in this iframe's own localStorage. */
function useWidgetSession(agentId: string) {
  const [ids, setIds] = useState<{ conversationId: string; visitorId: string } | null>(null);

  useEffect(() => {
    const visitorKey = "amueai_visitor_id";
    const conversationKey = `amueai_conversation_${agentId}`;

    let visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(visitorKey, visitorId);
    }

    let conversationId = localStorage.getItem(conversationKey);
    if (!conversationId) {
      conversationId = crypto.randomUUID();
      localStorage.setItem(conversationKey, conversationId);
    }

    setIds({ conversationId, visitorId });
  }, [agentId]);

  return ids;
}

export function EmbedChat({
  agentId,
  welcomeMessage,
}: {
  agentId: string;
  welcomeMessage: string;
}) {
  const session = useWidgetSession(agentId);

  if (!session) return null;

  return (
    <ChatPanel
      agentId={agentId}
      conversationId={session.conversationId}
      visitorId={session.visitorId}
      welcomeMessage={welcomeMessage}
    />
  );
}
