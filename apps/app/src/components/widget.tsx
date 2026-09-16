"use client";

import { BotIcon, EllipsisIcon, XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

const MORE_LINKS = [
  { label: "Support", href: "/support" },
  { label: "Terms of Service", href: "/legal/terms-of-service" },
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
];

/**
 * This is the PUBLIC widget - the only thing that ends up on a customer's
 * website. The trigger button, open/close state, panel sizing, and keyboard-
 * aware mobile positioning all live in the vanilla loader (`widget.js`) that
 * embeds this page in an iframe - none of that ships as React. This
 * component's only job is the panel's content: it always renders "open"
 * (fills whatever box the loader gives it) and tells the loader when it's
 * ready to be shown and when the visitor closed it from in here.
 *
 * Intentionally its own component tree, decoupled from the dashboard's
 * live-preview chat (`AgentTestChat`) - nothing dashboard-only can leak
 * into what ships here.
 */

const Chat = dynamic(() => import("@/components/widget-chat").then((m) => m.Chat), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  ),
});

function useWidgetSession(agentId: string) {
  const [ids, setIds] = useState<{ conversationId: string; visitorId: string } | null>(null);

  useEffect(() => {
    const read = (key: string) => {
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const created = crypto.randomUUID();
      localStorage.setItem(key, created);
      return created;
    };

    setIds({
      visitorId: read("amueai_visitor_id"),
      conversationId: read(`amueai_conversation_${agentId}`),
    });
  }, [agentId]);

  return ids;
}

export function Widget({
  agentId,
  agentName,
  welcomeMessage,
}: {
  agentId: string;
  agentName: string;
  welcomeMessage: string;
}) {
  const session = useWidgetSession(agentId);

  useEffect(() => {
    window.parent.postMessage({ type: "amueai:ready" }, "*");
  }, []);

  const close = () => window.parent.postMessage({ type: "amueai:close" }, "*");

  return (
    <div className="dark flex h-dvh flex-col bg-popover text-popover-foreground">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        {/* Placeholder for the agent's future brand image/logo tile. */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border-[3px] border-double border-border bg-muted text-muted-foreground">
          <BotIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{agentName}</p>
          {/* EU AI Act Art. 50(1) disclosure - must stay persistently visible, not one-time */}
          <p className="truncate text-xs text-muted-foreground">AI Agent</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button aria-label="More options" size="icon-sm" variant="outline">
                <EllipsisIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {MORE_LINKS.map((link) => (
              <DropdownMenuItem
                key={link.href}
                render={<a href={link.href} rel="noopener noreferrer" target="_blank" />}
              >
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button aria-label="Close chat" onClick={close} size="icon-sm" variant="ghost">
          <XIcon />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {session && <Chat agentId={agentId} welcomeMessage={welcomeMessage} {...session} />}
      </div>
    </div>
  );
}
