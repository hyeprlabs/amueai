"use client";

import { useState } from "react";
import { BotIcon, RotateCcwIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat-panel";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import type { AgentBrand } from "@/lib/branding";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { ModelSwitcher } from "./model-switcher";

function newSession() {
  return {
    conversationId: crypto.randomUUID(),
    visitorId: `dashboard-test-${crypto.randomUUID()}`,
  };
}

/**
 * A dark, widget-styled live preview of this agent - what a visitor sees on
 * the embed, not a bare test harness. Scoped to a dark theme with the
 * `.dark` class (this app's `dark:` variant is `&:is(.dark *)`, so it flips
 * every semantic token underneath without touching the real embed's own
 * light-by-default styling elsewhere).
 */
export function ChatPreview({
  agentId,
  agentName,
  brand,
  models,
  defaultModel,
}: {
  agentId: string;
  agentName: string;
  brand: AgentBrand | null;
  models: GatewayChatModel[];
  defaultModel: string;
}) {
  const [session, setSession] = useState(newSession);

  return (
    <div className="dark flex h-[36rem] flex-col overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {brand?.logo ? (
          // Firecrawl returns an arbitrary third-party logo URL, which
          // next/image would need whitelisted in remotePatterns per
          // customer domain - impossible for user-supplied sites.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo}
            alt=""
            className="size-6 shrink-0 rounded-full bg-background object-contain"
          />
        ) : (
          <IconTile variant="soft" size="sm">
            <BotIcon />
          </IconTile>
        )}
        <p className="flex-1 truncate text-sm font-medium">{agentName}</p>
        <Button
          aria-label="Reset conversation"
          size="icon-sm"
          variant="ghost"
          onClick={() => setSession(newSession())}
        >
          <RotateCcwIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <ChatPanel
          key={session.conversationId}
          agentId={agentId}
          conversationId={session.conversationId}
          visitorId={session.visitorId}
          toolbarStart={
            <ModelSwitcher agentId={agentId} models={models} defaultModel={defaultModel} />
          }
        />
      </div>
    </div>
  );
}
