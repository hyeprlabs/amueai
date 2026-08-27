"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";

/**
 * The chat UI both the dashboard test-chat panel and the public widget
 * render, wired to the same `/api/chat/[chatbotId]` endpoint. The caller
 * owns where conversationId/visitorId come from (a fresh id per session
 * for the dashboard, localStorage for the widget).
 */
export function ChatPanel({
  chatbotId,
  conversationId,
  visitorId,
  emptyState = "Try asking this chatbot something from its sources.",
}: {
  chatbotId: string;
  conversationId: string;
  visitorId: string;
  emptyState?: string;
}) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatbotId}`,
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages.at(-1);
        const text = lastMessage?.parts.find((part) => part.type === "text")?.text ?? "";

        return { body: { message: text, conversationId, visitorId } };
      },
    }),
  });

  return (
    <div className="flex h-full flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && <p className="text-sm text-muted-foreground">{emptyState}</p>}
          {messages.map((message) => (
            <Message key={message.id} from={message.role === "user" ? "user" : "assistant"}>
              <MessageContent from={message.role === "user" ? "user" : "assistant"}>
                {message.parts.map((part, i) =>
                  part.type === "text" ? <Response key={i}>{part.text}</Response> : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Thinking…
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
        </ConversationContent>
      </Conversation>

      <PromptInput
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
        />
        <PromptInputSubmit disabled={!input.trim()} status={status} />
      </PromptInput>
    </div>
  );
}
