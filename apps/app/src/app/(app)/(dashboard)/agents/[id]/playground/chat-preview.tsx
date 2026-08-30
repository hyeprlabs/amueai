"use client";

import { useRef } from "react";

import { ChatWidget } from "@/components/chat-widget";
import type { AgentBrand } from "@/lib/branding";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { ModelSwitcher } from "./model-switcher";

/**
 * The Playground's live preview - not a bare test harness, the actual
 * ChatWidget shown the way a visitor meets it on the real embed: closed by
 * default, opened from its own floating bubble. Bounded to this frame
 * (ChatWidget's `containerRef`) instead of the real widget's fixed-to-
 * viewport behavior, so it reads as "here's your site's corner", not as
 * something covering the dashboard itself.
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
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative isolate h-[40rem] overflow-hidden rounded-xl border bg-muted/30"
      ref={frameRef}
    >
      <div className="absolute right-4 bottom-4">
        <ChatWidget
          agentId={agentId}
          agentName={agentName}
          brand={brand}
          containerRef={frameRef}
          toolbarStart={
            <ModelSwitcher agentId={agentId} models={models} defaultModel={defaultModel} />
          }
        />
      </div>
    </div>
  );
}
