"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
import { cn } from "@/lib/utils";

type UIMessages = ReturnType<typeof useChat>["messages"];

const MessageRow = memo(function MessageRow({
  message,
  failed,
  reduceMotion,
}: {
  message: UIMessages[number];
  failed: boolean;
  reduceMotion: boolean;
}) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  if (message.role === "assistant" && (!text || failed)) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <Message className="gap-0.5" from={message.role}>
        <MessageContent
          className={cn(
            "text-xs leading-relaxed",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "border bg-card text-card-foreground",
          )}
        >
          <MessageResponse>{text}</MessageResponse>
        </MessageContent>
      </Message>
    </motion.div>
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
  const reduceMotion = useReducedMotion();
  const lastMessageId = messages.at(-1)?.id;

  return (
    <Conversation className="min-h-0">
      <ConversationContent className="gap-3 p-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageRow
              failed={Boolean(error) && message.id === lastMessageId}
              key={message.id}
              message={message}
              reduceMotion={Boolean(reduceMotion)}
            />
          ))}
        </AnimatePresence>
        {thinking && (
          <Message from="assistant">
            <Shimmer className="px-1 text-xs">Thinking…</Shimmer>
          </Message>
        )}
        {error && (
          <Message from="assistant">
            <MessageContent className="border bg-card text-xs leading-relaxed text-card-foreground">
              {error.message}
            </MessageContent>
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
    <form className="relative border-t p-3" onSubmit={onSubmit}>
      <Input
        className="h-11 rounded-full bg-card pe-11 shadow-sm"
        disabled={busy}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question…"
        value={value}
      />
      <motion.div
        className="absolute inset-y-0 end-4 my-auto"
        whileHover={value.trim() && !busy ? { scale: 1.08 } : undefined}
        whileTap={value.trim() && !busy ? { scale: 0.92 } : undefined}
      >
        <Button
          aria-label="Send message"
          className="size-8 rounded-full"
          disabled={!value.trim() || busy}
          size="icon-sm"
          type="submit"
        >
          <ArrowUpIcon />
        </Button>
      </motion.div>
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
