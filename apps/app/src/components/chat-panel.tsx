"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Fragment } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";

/**
 * The chat UI both the dashboard test-chat panel and the public widget
 * render, wired to the same `/api/chat/[agentId]` endpoint. The caller
 * owns where conversationId/visitorId come from (a fresh id per session
 * for the dashboard, localStorage for the widget).
 */
export function ChatPanel({
  agentId,
  conversationId,
  visitorId,
  emptyState = "Try asking this agent something from its sources.",
}: {
  agentId: string;
  conversationId: string;
  visitorId: string;
  emptyState?: string;
}) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat/${agentId}`,
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages.at(-1);
        const text = lastMessage?.parts.find((part) => part.type === "text")?.text ?? "";

        return { body: { message: text, conversationId, visitorId } };
      },
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
  };

  return (
    <div className="flex h-full flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && <ConversationEmptyState description={emptyState} />}
          {messages.map((message) => {
            const sourceParts = message.parts.filter((part) => part.type === "source-url");

            return (
              <Fragment key={message.id}>
                {message.role === "assistant" && sourceParts.length > 0 && (
                  <Sources>
                    <SourcesTrigger count={sourceParts.length} />
                    <SourcesContent>
                      {sourceParts.map((part, i) => (
                        <Source
                          key={`${message.id}-source-${i}`}
                          href={part.url}
                          title={part.title}
                        />
                      ))}
                    </SourcesContent>
                  </Sources>
                )}
                <Message from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              </Fragment>
            );
          })}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea placeholder="Ask a question…" />
        <PromptInputSubmit status={status} />
      </PromptInput>
    </div>
  );
}
