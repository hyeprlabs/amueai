"use client";

import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat-panel";

/** conversationId/visitorId persist in this iframe's own localStorage. */
function useWidgetSession(chatbotId: string) {
  const [ids, setIds] = useState<{ conversationId: string; visitorId: string } | null>(null);

  useEffect(() => {
    const visitorKey = "amueai_visitor_id";
    const conversationKey = `amueai_conversation_${chatbotId}`;

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
  }, [chatbotId]);

  return ids;
}

export function EmbedChat({ chatbotId }: { chatbotId: string }) {
  const session = useWidgetSession(chatbotId);

  if (!session) return null;

  return (
    <ChatPanel
      chatbotId={chatbotId}
      conversationId={session.conversationId}
      visitorId={session.visitorId}
      emptyState="Ask me anything!"
    />
  );
}
