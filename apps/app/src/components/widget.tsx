"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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

function MessageList({
  messages,
  thinking,
  error,
}: {
  messages: UIMessages;
  thinking: boolean;
  error?: Error;
}) {
  const lastMessageId = messages.at(-1)?.id;

  return (
    <Conversation className="min-h-0">
      <ConversationContent className="gap-3 p-3">
        {messages.map((message) => {
          const text = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");
          const failed = Boolean(error) && message.id === lastMessageId;
          if (message.role === "assistant" && (!text || failed)) return null;

          return (
            <Message className="gap-0.5" from={message.role} key={message.id}>
              <MessageContent className="text-xs leading-relaxed">
                <MessageResponse>{text}</MessageResponse>
              </MessageContent>
            </Message>
          );
        })}
        {thinking && (
          <Message from="assistant">
            <Shimmer className="px-1 text-xs">Thinking…</Shimmer>
          </Message>
        )}
        {error && (
          <Message from="assistant">
            <MessageContent className="text-xs leading-relaxed">{error.message}</MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
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

  const { messages, sendMessage, status, error } = useChat({
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
      <MessageList error={error} messages={messages} thinking={status === "submitted"} />
      <Composer busy={busy} onChange={setInput} onSubmit={handleSubmit} value={input} />
    </div>
  );
}

export function Widget({
  agentId,
  agentName,
  welcomeMessage,
  side = "right",
}: {
  agentId: string;
  agentName: string;
  welcomeMessage: string;
  side?: "left" | "right";
}) {
  const session = useWidgetSession(agentId);
  const [open, setOpen] = useState(false);

  const toggle = (next: boolean) => {
    const framed = window.parent !== window;
    if (framed) {
      window.parent.postMessage({ type: next ? "amueai:open" : "amueai:close" }, "*");
    }
    if (!next) return setOpen(false);
    if (!framed) return setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  };

  return (
    <Popover onOpenChange={toggle} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label={open ? "Close chat" : "Open chat"}
            className={cn(
              "dark fixed rounded-full bg-popover text-popover-foreground hover:bg-popover/90",
              open ? "bottom-0 size-0 border-0 p-0 opacity-0" : "inset-0 size-full [&_svg]:size-6",
              side === "left" ? "left-0" : "right-0",
            )}
            size="icon-lg"
          />
        }
      >
        <MessageCircleIcon />
      </PopoverTrigger>
      <PopoverContent
        align={side === "left" ? "start" : "end"}
        collisionPadding={0}
        className="dark flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 shadow-none ring-0"
        side="top"
        sideOffset={0}
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
