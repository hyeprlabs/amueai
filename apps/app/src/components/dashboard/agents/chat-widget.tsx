"use client";

import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat-panel";
import { Button } from "@/components/ui/button";

function newSession(prefix: string) {
  return {
    conversationId: crypto.randomUUID(),
    visitorId: `${prefix}-${crypto.randomUUID()}`,
  };
}

/**
 * The chat, packaged as a visitor sees it on the real embed once they've
 * opened it: a small floating card. The bubble/toggle interaction itself
 * lives in the caller (ChatPreview's Popover) - this component is just the
 * opened panel. Source citations are hidden - visitors don't need
 * footnotes, only the answer.
 */
export function ChatWidget({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [session, setSession] = useState(() => newSession("widget"));

  return (
    <div className="dark flex h-[32rem] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <p className="flex-1 truncate text-sm font-medium">{agentName}</p>
        <Button
          aria-label="Reset conversation"
          onClick={() => setSession(newSession("widget"))}
          size="icon-sm"
          variant="ghost"
        >
          <RotateCcwIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <ChatPanel
          agentId={agentId}
          conversationId={session.conversationId}
          key={session.conversationId}
          showSources={false}
          visitorId={session.visitorId}
        />
      </div>
    </div>
  );
}
