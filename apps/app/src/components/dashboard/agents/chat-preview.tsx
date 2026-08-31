"use client";

import { MessageCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatWidget } from "@/components/dashboard/agents/chat-widget";

/**
 * The Playground's live preview - the real bubble + popover a visitor gets
 * on the embed, not just a static mock of the opened state. Starts open so
 * the preview is useful the moment this page loads.
 */
export function ChatPreview({
  agentId,
  agentName,
  welcomeMessage,
}: {
  agentId: string;
  agentName: string;
  welcomeMessage: string;
}) {
  return (
    <div className="relative isolate h-[40rem] overflow-hidden rounded-xl border bg-muted/30">
      <Popover defaultOpen>
        <PopoverTrigger
          render={
            <Button
              aria-label="Toggle chat"
              className="absolute right-4 bottom-4 size-14 rounded-full shadow-lg"
              size="icon-lg"
            />
          }
        >
          <MessageCircleIcon className="size-6" />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto rounded-none border-none bg-transparent p-0 shadow-none ring-0"
          side="top"
          sideOffset={12}
        >
          <ChatWidget agentId={agentId} agentName={agentName} welcomeMessage={welcomeMessage} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
