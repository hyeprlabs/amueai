"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import { memo, useMemo, useState, type FormEvent } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UIMessages = ReturnType<typeof useChat>["messages"];

const TestMessageRow = memo(function TestMessageRow({
  message,
  failed,
}: {
  message: UIMessages[number];
  failed: boolean;
}) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  if (message.role === "assistant" && (!text || failed)) return null;

  return (
    <Message className="gap-0.5" from={message.role}>
      <MessageContent className="text-sm leading-relaxed">
        <MessageResponse>{text}</MessageResponse>
      </MessageContent>
    </Message>
  );
});

/**
 * The dashboard's own live-preview chat. Intentionally a separate component
 * tree from `@/components/widget` (the public embed) - it renders inline
 * in the dashboard, needs no shadow DOM, iframe framing, or trigger button,
 * and can evolve (e.g. a "reset" control) without touching what ships to
 * customer sites.
 */
export function AgentTestChat({
  agentId,
  agentName,
  welcomeMessage,
}: {
  agentId: string;
  agentName: string;
  welcomeMessage: string;
}) {
  const [input, setInput] = useState("");
  const [session, setSession] = useState(() => crypto.randomUUID());

  const welcome = useMemo(
    () => ({
      id: "welcome",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: welcomeMessage }],
    }),
    [welcomeMessage],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: session,
    messages: [welcome],
    transport: new DefaultChatTransport({
      api: `/api/chat/${agentId}`,
      prepareSendMessagesRequest: ({ messages: sent }) => ({
        body: {
          message: sent.at(-1)?.parts.find((part) => part.type === "text")?.text ?? "",
          conversationId: session,
          visitorId: `dashboard-preview-${session}`,
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

  const reset = () => {
    const nextSession = crypto.randomUUID();
    setSession(nextSession);
    setMessages([welcome]);
    setInput("");
  };

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SparklesIcon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{agentName}</p>
          <p className="text-xs text-muted-foreground">Live preview</p>
        </div>
        <Button
          aria-label="Restart conversation"
          disabled={messages.length <= 1 && !busy}
          onClick={reset}
          size="icon-sm"
          variant="ghost"
        >
          <RotateCcwIcon />
        </Button>
      </div>

      <Conversation className="min-h-0">
        <ConversationContent className="gap-3 p-4">
          {messages.map((message) => (
            <TestMessageRow
              failed={Boolean(error) && message.id === messages.at(-1)?.id}
              key={message.id}
              message={message}
            />
          ))}
          {status === "submitted" && (
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

      <form className="relative border-t p-3" onSubmit={handleSubmit}>
        <Input
          className={cn("h-11 rounded-full pe-11 shadow-sm")}
          disabled={busy}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask this agent a question…"
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
    </div>
  );
}
