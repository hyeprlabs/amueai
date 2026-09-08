"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

type UIMessages = ReturnType<typeof useChat>["messages"];

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
  const side = useSearchParams().get("side") === "left" ? "left" : "right";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.parent.postMessage({ type: open ? "amueai:open" : "amueai:close" }, "*");
  }, [open]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label={open ? "Close chat" : "Open chat"}
            className={cn(
              "fixed bottom-4 size-14 rounded-full shadow-lg transition-transform",
              side === "left" ? "left-4" : "right-4",
              open && "scale-0",
            )}
            size="icon-lg"
          />
        }
      >
        <MessageCircleIcon className="size-6" />
      </PopoverTrigger>
      <PopoverContent
        align={side === "left" ? "start" : "end"}
        className="flex h-[560px] w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0"
        side="top"
        sideOffset={12}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <p className="flex-1 truncate text-sm font-medium">{agentName}</p>
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
          {session && <Chat agentId={agentId} welcomeMessage={welcomeMessage} {...session} />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
