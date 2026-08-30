"use client";

import { type ReactNode, useState } from "react";
import { BotIcon, MessageCircleIcon, RotateCcwIcon, XIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat-panel";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AgentBrand } from "@/lib/branding";

function newSession(prefix: string) {
  return {
    conversationId: crypto.randomUUID(),
    visitorId: `${prefix}-${crypto.randomUUID()}`,
  };
}

/**
 * The chat, packaged exactly as a visitor meets it on the real embed: a
 * floating round bubble that pops open into a chat window - shadcn's
 * Popover doing the same job `widget.js` does with raw DOM on a customer's
 * site (that script has to stay vanilla JS; it runs on pages we don't
 * control and can't assume a bundler or Tailwind reset). This is that same
 * shape, built with our own real components, for anywhere inside the
 * dashboard that wants to show (not just describe) what the widget does.
 *
 * `containerRef`, when given, confines the popup to that element instead of
 * portaling to `<body>` - the Playground preview uses this so the demo
 * bubble stays inside its own bounded frame rather than floating over the
 * rest of the dashboard.
 */
export function ChatWidget({
  agentId,
  agentName,
  brand,
  toolbarStart,
  containerRef,
  defaultOpen = false,
}: {
  agentId: string;
  agentName: string;
  brand: AgentBrand | null;
  toolbarStart?: ReactNode;
  containerRef?: React.RefObject<HTMLElement | null>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [session, setSession] = useState(() => newSession("widget"));

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverContent
        align="end"
        className="dark flex h-[32rem] w-96 max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl bg-background p-0 ring-1 ring-foreground/10"
        container={containerRef}
        side="top"
        sideOffset={16}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {brand?.logo ? (
            // Firecrawl returns an arbitrary third-party logo URL, which
            // next/image would need whitelisted in remotePatterns per
            // customer domain - impossible for user-supplied sites.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="size-6 shrink-0 rounded-full bg-background object-contain"
              src={brand.logo}
            />
          ) : (
            <IconTile size="sm" variant="soft">
              <BotIcon />
            </IconTile>
          )}
          <p className="flex-1 truncate text-sm font-medium">{agentName}</p>
          <Button
            aria-label="Reset conversation"
            onClick={() => setSession(newSession("widget"))}
            size="icon-sm"
            variant="ghost"
          >
            <RotateCcwIcon />
          </Button>
          <Button
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <ChatPanel
            agentId={agentId}
            conversationId={session.conversationId}
            key={session.conversationId}
            toolbarStart={toolbarStart}
            visitorId={session.visitorId}
          />
        </div>
      </PopoverContent>
      <PopoverTrigger
        aria-label={open ? "Close chat" : "Open chat"}
        render={<Button className="size-14 rounded-full shadow-lg" />}
      >
        {open ? <XIcon className="size-6" /> : <MessageCircleIcon className="size-6" />}
      </PopoverTrigger>
    </Popover>
  );
}
