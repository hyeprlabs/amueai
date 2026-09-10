"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowRightIcon } from "lucide-react";
import { memo, useState, type FormEvent } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UIMessages = ReturnType<typeof useChat>["messages"];

const MessageRow = memo(function MessageRow({
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
      <MessageContent className="text-xs leading-relaxed">
        <MessageResponse>{text}</MessageResponse>
      </MessageContent>
    </Message>
  );
});

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
        {messages.map((message) => (
          <MessageRow
            failed={Boolean(error) && message.id === lastMessageId}
            key={message.id}
            message={message}
          />
        ))}
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
    <form className="flex items-center gap-2 border-t p-3" onSubmit={onSubmit}>
      <Input
        className="h-11 flex-1 rounded-full shadow-sm"
        disabled={busy}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question…"
        value={value}
      />
      <Button
        aria-label="Send message"
        className="size-11 shrink-0 rounded-full"
        disabled={!value.trim() || busy}
        size="icon"
        type="submit"
      >
        <ArrowRightIcon />
      </Button>
    </form>
  );
}

export function Chat({
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
