"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatPanel({
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
  const lastMessageId = messages.at(-1)?.id;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || busy) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
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
              <Message from={message.role} key={message.id}>
                <MessageContent className="text-xs leading-relaxed">
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}

          {status === "submitted" && (
            <Message from="assistant">
              <Shimmer className="px-1 text-xs">Thinking…</Shimmer>
            </Message>
          )}

          {error && (
            <Message from="assistant">
              <MessageContent className="text-xs leading-relaxed">
                <p>{error.message}</p>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form className="relative p-3" onSubmit={handleSubmit}>
        <Input
          className="h-11 rounded-full pe-11 shadow-sm"
          disabled={busy}
          onChange={(event) => setInput(event.target.value)}
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
    </div>
  );
}
