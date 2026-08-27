import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

export const metadata: Metadata = createMetadata({
  title: "Conversation",
  description: "A single conversation's messages.",
  pathname: "/chatbots",
  noIndex: true,
});

export default async function ConversationPage({
  params,
}: PageProps<"/chatbots/[id]/conversations/[conversationId]">) {
  const { conversationId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, visitor_id, created_at")
    .eq("id", conversationId)
    .single();
  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Conversation</h1>
        <p className="font-mono text-xs text-muted-foreground">{conversation.visitor_id}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4">
        {!messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages.</p>
        ) : (
          messages.map((message) => (
            <Message key={message.id} from={message.role === "user" ? "user" : "assistant"}>
              <MessageContent from={message.role === "user" ? "user" : "assistant"}>
                <Response>{message.content}</Response>
              </MessageContent>
            </Message>
          ))
        )}
      </div>
    </div>
  );
}
