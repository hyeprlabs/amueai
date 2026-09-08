"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

function useCloseOnEscape() {
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.parent.postMessage({ type: "amueai:close" }, "*");
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, []);
}

function MessageList({ messages, thinking }: { messages: UIMessages; thinking: boolean }) {
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
        {thinking && (
          <Message from="assistant">
            <Shimmer className="px-1 text-xs">Thinking…</Shimmer>
          </Message>
        )}
      </ConversationContent>
    </Conversation>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
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
        value={value}
      />
      <Button
        aria-label="Send message"
        className="absolute inset-y-0 end-4 my-auto size-8 rounded-full"
        disabled={!value.trim() || busy}
        size="icon-sm"
        type="submit"
      >
        <ArrowUpIcon />
      </Button>
    </form>
  );
}

type UIMessages = ReturnType<typeof useChat>["messages"];

function Chat({
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
    if (!input.trim() || busy) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} thinking={status === "submitted"} />
      <Composer busy={busy} onChange={setInput} onSubmit={handleSubmit} value={input} />
    </div>
  );
}

export function Widget({ agentId, welcomeMessage }: { agentId: string; welcomeMessage: string }) {
  const session = useWidgetSession(agentId);
  useCloseOnEscape();

  if (!session) return null;

  return <Chat agentId={agentId} welcomeMessage={welcomeMessage} {...session} />;
}
