"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const FULLSCREEN_BREAKPOINT_PX = 480;

function useParentBridge(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let rafId: number;
    const resizeObserver = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        window.parent.postMessage({ type: "amueai:resize", height: entry.contentRect.height }, "*");
      });
    });
    resizeObserver.observe(root);

    let wasFullscreen: boolean | null = null;
    const mediaQuery = window.matchMedia(`(max-width: ${FULLSCREEN_BREAKPOINT_PX}px)`);
    const reportFullscreen = () => {
      if (mediaQuery.matches === wasFullscreen) return;
      wasFullscreen = mediaQuery.matches;
      window.parent.postMessage({ type: "amueai:fullscreen", value: mediaQuery.matches }, "*");
    };
    reportFullscreen();
    mediaQuery.addEventListener("change", reportFullscreen);

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.parent.postMessage({ type: "amueai:close" }, "*");
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", reportFullscreen);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [rootRef]);
}

function MessageList({
  messages,
  busy,
}: {
  messages: ReturnType<typeof useChat>["messages"];
  busy: boolean;
}) {
  return (
    <Conversation className="min-h-0">
      <ConversationContent className="gap-3 p-3">
        {messages.map((message) => (
          <Message className="gap-0.5" from={message.role} key={message.id}>
            <MessageContent className="text-xs leading-relaxed">
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <MessageResponse key={i}>{part.text}</MessageResponse>
                ) : null,
              )}
            </MessageContent>
          </Message>
        ))}
        {busy && (
          <Message from="assistant">
            <Shimmer className="px-1 text-xs">Thinking…</Shimmer>
          </Message>
        )}
      </ConversationContent>
    </Conversation>
  );
}

function Composer({
  input,
  onChange,
  onSubmit,
  busy,
}: {
  input: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
}) {
  return (
    <form className="relative p-3" onSubmit={onSubmit}>
      <Input
        className="h-11 rounded-full pe-11 shadow-sm"
        disabled={busy}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question…"
        value={input}
      />
      <Button
        aria-label="Send message"
        className="absolute inset-y-0 end-4 my-auto size-8 rounded-full"
        disabled={!input.trim() || busy}
        size="icon-sm"
        type="submit"
      >
        <ArrowUpIcon />
      </Button>
    </form>
  );
}

function WidgetChat({
  agentId,
  conversationId,
  visitorId,
  welcomeMessage,
}: {
  agentId: string;
  conversationId: string;
  visitorId: string;
  welcomeMessage: string;
}) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    messages: [
      { id: "welcome", role: "assistant", parts: [{ type: "text", text: welcomeMessage }] },
    ],
    transport: new DefaultChatTransport({
      api: `/api/chat/${agentId}`,
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          message: messages.at(-1)?.parts.find((part) => part.type === "text")?.text ?? "",
          conversationId,
          visitorId,
        },
      }),
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList busy={status === "submitted"} messages={messages} />
      <Composer busy={busy} input={input} onChange={setInput} onSubmit={handleSubmit} />
    </div>
  );
}

export function Widget({ agentId, welcomeMessage }: { agentId: string; welcomeMessage: string }) {
  const session = useWidgetSession(agentId);
  const rootRef = useRef<HTMLDivElement>(null);
  useParentBridge(rootRef);

  return (
    <div className="h-full w-full" id="chat-root" ref={rootRef}>
      {session && (
        <WidgetChat
          agentId={agentId}
          conversationId={session.conversationId}
          visitorId={session.visitorId}
          welcomeMessage={welcomeMessage}
        />
      )}
    </div>
  );
}
