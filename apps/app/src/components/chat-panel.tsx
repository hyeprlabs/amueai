"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { Component, Fragment, useRef, useState, type FormEvent, type ReactNode } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";

function formatTimestamp(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Streamdown re-parses the full message on every streaming delta, so one
 * malformed chunk can throw mid-stream. Without a boundary that throw
 * unmounts the whole ChatPanel - killing scroll, the input, and every other
 * message with it - instead of just that one reply falling back to plain
 * text. Resets on the next delta/retry rather than freezing on the bubble
 * that first crashed.
 */
class MessageErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { children: ReactNode }) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * The chat UI both the Playground's ChatWidget and the public embed render,
 * wired to the same `/api/chat/[agentId]` endpoint. The caller owns where
 * conversationId/visitorId come from (a fresh id per session for the
 * dashboard, localStorage for the widget).
 */
export function ChatPanel({
  agentId,
  conversationId,
  visitorId,
  emptyState = "Try asking this agent something from its sources.",
  showSources = true,
}: {
  agentId: string;
  conversationId: string;
  visitorId: string;
  emptyState?: string;
  /** The public widget hides source citations from visitors; the dashboard keeps them visible. */
  showSources?: boolean;
}) {
  const [input, setInput] = useState("");

  // Message ids never change once assigned, so this doubles as a stable
  // per-message "sent at" clock without needing a timestamp from the wire.
  const timestamps = useRef(new Map<string, number>());
  const getTimestamp = (id: string) => {
    let time = timestamps.current.get(id);
    if (time === undefined) {
      time = Date.now();
      timestamps.current.set(id, time);
    }
    return time;
  };
  const errorTimestamp = useRef<number | null>(null);

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

  if (error) {
    errorTimestamp.current ??= Date.now();
  } else {
    errorTimestamp.current = null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;
    setInput("");
    sendMessage({ text });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0">
        <ConversationContent className="gap-3 p-3">
          {messages.length === 0 && <ConversationEmptyState description={emptyState} />}
          {messages.map((message) => {
            const sourceParts = message.parts.filter((part) => part.type === "source-url");
            const rawText = message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("");

            return (
              <Fragment key={message.id}>
                {showSources && message.role === "assistant" && sourceParts.length > 0 && (
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
                <Message className="gap-0.5" from={message.role}>
                  <MessageContent className="px-3 py-2 text-xs leading-relaxed">
                    <MessageErrorBoundary fallback={<p className="whitespace-pre-wrap">{rawText}</p>}>
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        ) : null,
                      )}
                    </MessageErrorBoundary>
                  </MessageContent>
                  <span
                    className={cn(
                      "px-1 text-[10px] text-muted-foreground",
                      message.role === "user" ? "text-right" : "text-left",
                    )}
                  >
                    {formatTimestamp(getTimestamp(message.id))}
                  </span>
                </Message>
              </Fragment>
            );
          })}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="px-3 py-2 text-xs">
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <Message className="gap-0.5" from="assistant">
              <MessageContent className="px-3 py-2 text-xs leading-relaxed">
                <p className="whitespace-pre-wrap">{error.message || "Something went wrong."}</p>
              </MessageContent>
              <span className="px-1 text-left text-[10px] text-muted-foreground">
                {formatTimestamp(errorTimestamp.current ?? Date.now())}
              </span>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="px-3 pb-3">
        <form className="relative" onSubmit={handleSubmit}>
          <Input
            className="h-11 rounded-full pe-11 shadow-sm"
            disabled={status !== "ready"}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question…"
            value={input}
          />
          <div className="absolute inset-y-0 end-1.5 flex items-center justify-center">
            <Button
              aria-label="Send message"
              className="size-8 rounded-full"
              disabled={!input.trim() || status !== "ready"}
              size="icon-sm"
              type="submit"
            >
              <ArrowUpIcon />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
