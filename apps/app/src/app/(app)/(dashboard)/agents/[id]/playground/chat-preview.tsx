import { ChatWidget } from "@/components/chat-widget";

/**
 * The Playground's live preview - the actual ChatWidget, always open, shown
 * the way a visitor sees it once opened on the real embed.
 */
export function ChatPreview({ agentId, agentName }: { agentId: string; agentName: string }) {
  return (
    <div className="relative isolate h-[40rem] overflow-hidden rounded-xl border bg-muted/30">
      <div className="absolute right-4 bottom-4">
        <ChatWidget agentId={agentId} agentName={agentName} />
      </div>
    </div>
  );
}
