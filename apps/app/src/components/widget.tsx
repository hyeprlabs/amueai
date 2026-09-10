"use client";

import { MessageCircleIcon, XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * This is the PUBLIC widget - the only thing that ends up on a customer's
 * website, loaded through `/widget.js` -> `/embed/[agentId]` in a sandboxed
 * iframe. It is intentionally its own component tree, decoupled from the
 * dashboard's live-preview chat (`AgentTestChat`): nothing dashboard-only
 * can leak into what ships here, and this can stay minimal and fast without
 * worrying about the dashboard's needs.
 */

const Chat = dynamic(() => import("@/components/widget-chat").then((m) => m.Chat), {
  ssr: false,
  loading: () => <ChatSkeleton />,
});

const preloadChat = () => {
  void import("@/components/widget-chat");
};

function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-3 p-3">
        <Skeleton className="h-12 w-3/4 rounded-lg" />
        <Skeleton className="ml-auto h-8 w-1/2 rounded-lg" />
        <Skeleton className="h-16 w-4/5 rounded-lg" />
      </div>
      <div className="border-t p-3">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

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

function PanelHeader({ agentName, onClose }: { agentName: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b px-4 py-3">
      <p className="flex-1 truncate text-sm font-medium">{agentName}</p>
      <Button aria-label="Close chat" onClick={onClose} size="icon-sm" variant="ghost">
        <XIcon />
      </Button>
    </div>
  );
}

export function Widget({
  agentId,
  agentName,
  welcomeMessage,
  side = "right",
  mobile = false,
}: {
  agentId: string;
  agentName: string;
  welcomeMessage: string;
  side?: "left" | "right";
  mobile?: boolean;
}) {
  const session = useWidgetSession(agentId);
  const [open, setOpen] = useState(false);

  const toggle = (next: boolean) => {
    window.parent.postMessage({ type: next ? "amueai:open" : "amueai:close" }, "*");
    setOpen(next);
  };

  const hideTrigger = mobile && open;

  const trigger = (
    <Button
      aria-hidden={hideTrigger}
      aria-label={open ? "Close chat" : "Open chat"}
      className={cn(
        "dark fixed bottom-0 z-10 size-14 rounded-full bg-popover text-popover-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 [&_svg]:size-6",
        side === "left" ? "left-0" : "right-0",
        hideTrigger && "pointer-events-none opacity-0",
      )}
      onFocus={preloadChat}
      onPointerEnter={preloadChat}
      size="icon-lg"
      tabIndex={hideTrigger ? -1 : 0}
    />
  );

  if (mobile) {
    return (
      <Drawer onOpenChange={toggle} open={open}>
        <DrawerTrigger render={trigger}>
          <MessageCircleIcon />
        </DrawerTrigger>
        <DrawerContent
          aria-label="Chat"
          className="dark flex flex-col gap-0 overflow-hidden !rounded-none !border-t-0 bg-popover p-0"
          style={
            {
              "--drawer-height": "100vh",
              "--drawer-content-max-height": "100vh",
            } as CSSProperties
          }
        >
          <PanelHeader agentName={agentName} onClose={() => toggle(false)} />
          <div className="min-h-0 flex-1">
            {session && <Chat agentId={agentId} welcomeMessage={welcomeMessage} {...session} />}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover onOpenChange={toggle} open={open}>
      <PopoverTrigger render={trigger}>
        <MessageCircleIcon />
      </PopoverTrigger>
      <PopoverContent
        align={side === "left" ? "start" : "end"}
        className="dark flex h-[560px] max-h-[calc(100vh-6rem)] w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0"
        side="top"
        sideOffset={16}
      >
        <PanelHeader agentName={agentName} onClose={() => toggle(false)} />
        <div className="min-h-0 flex-1">
          {session && <Chat agentId={agentId} welcomeMessage={welcomeMessage} {...session} />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
