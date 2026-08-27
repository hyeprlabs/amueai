"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";

export function TestChat({ chatbotId }: { chatbotId: string }) {
  const [input, setInput] = useState("");
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const visitorId = useMemo(() => `dashboard-test-${crypto.randomUUID()}`, []);

  const { messages, sendMessage, status } = useChat({
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
    <div className="flex h-[32rem] flex-col rounded-lg border">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Try asking this chatbot something from its sources.
            </p>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role === "user" ? "user" : "assistant"}>
              <MessageContent from={message.role === "user" ? "user" : "assistant"}>
                {message.parts.map((part, i) =>
                  part.type === "text" ? <Response key={i}>{part.text}</Response> : null,
                )}
              </MessageContent>
            </Message>
          ))}
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
