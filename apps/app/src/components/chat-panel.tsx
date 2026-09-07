"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUpIcon, ClockIcon } from "lucide-react";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decodeRateLimitMessage, RATE_LIMIT_MESSAGE } from "@/lib/chat-errors";
import { cn } from "@/lib/utils";

function formatTimestamp(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

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

  const initialMessages = useMemo<UIMessage[]>(
    () => [{ id: "welcome", role: "assistant", parts: [{ type: "text", text: welcomeMessage }] }],
    [welcomeMessage],
  );

  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
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

  const decodedError = error ? decodeRateLimitMessage(error.message) : undefined;
  const retryAt = decodedError?.retryAt;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!retryAt || retryAt <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [retryAt]);
  const secondsUntilRetry = retryAt ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : 0;
  const isRateLimitedNow = Boolean(retryAt && secondsUntilRetry > 0);

  const isBusy = status === "submitted" || status === "streaming";
  const canSubmit = !isBusy && !isRateLimitedNow;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canSubmit) return;
    setInput("");
    sendMessage({ text });
  };

  const lastMessageId = messages.at(-1)?.id;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0">
        <ConversationContent className="gap-3 p-3">
          {messages.map((message) => {
            const rawText = message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("");

            const isFailedTurn = Boolean(error) && message.id === lastMessageId;
            if (message.role === "assistant" && (!rawText || isFailedTurn)) {
              return null;
            }

            return (
              <Message className="gap-0.5" from={message.role} key={message.id}>
                <MessageContent className="text-xs leading-relaxed">
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
            );
          })}
          {status === "submitted" && (
            <Message from="assistant">
              <Shimmer className="px-1 text-xs">Thinking…</Shimmer>
            </Message>
          )}
          {error &&
            (decodedError?.text === RATE_LIMIT_MESSAGE ? (
              <Message className="gap-0.5" from="assistant">
                <MessageContent className="flex-row items-center gap-1.5 border-amber-500/40 bg-amber-500/10 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                  <ClockIcon className="size-3.5 shrink-0" />
                  <p className="whitespace-pre-wrap">
                    {decodedError.text}
                    {retryAt &&
                      (isRateLimitedNow
                        ? ` You can try again in ${secondsUntilRetry}s (at ${formatTimestamp(retryAt)}).`
                        : " You can try again now.")}
                  </p>
                </MessageContent>
                <span className="px-1 text-left text-[10px] text-muted-foreground">
                  {formatTimestamp(errorTimestamp.current ?? Date.now())}
                </span>
              </Message>
            ) : (
              <Message className="gap-0.5" from="assistant">
                <MessageContent className="text-xs leading-relaxed">
                  <p className="whitespace-pre-wrap">
                    {decodedError?.text || "Something went wrong."}
                  </p>
                </MessageContent>
                <span className="px-1 text-left text-[10px] text-muted-foreground">
                  {formatTimestamp(errorTimestamp.current ?? Date.now())}
                </span>
              </Message>
            ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="px-3 pb-3">
        <form className="relative" onSubmit={handleSubmit}>
          <Input
            className="h-11 rounded-full pe-11 shadow-sm"
            disabled={isBusy}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question…"
            value={input}
          />
          <div className="absolute inset-y-0 end-1.5 flex items-center justify-center">
            <Button
              aria-label="Send message"
              className="size-8 rounded-full"
              disabled={!input.trim() || !canSubmit}
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
