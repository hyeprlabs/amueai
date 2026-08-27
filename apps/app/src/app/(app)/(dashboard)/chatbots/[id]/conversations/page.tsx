import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Conversations",
  description: "Every widget and test-chat conversation for this chatbot.",
  pathname: "/chatbots",
  noIndex: true,
});

export default async function ConversationsPage({
  params,
}: PageProps<"/chatbots/[id]/conversations">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!chatbot) notFound();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, visitor_id, created_at")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Conversations — {chatbot.name}</h1>
        <p className="text-sm text-muted-foreground">
          Every widget and test-chat conversation for this chatbot.
        </p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
          No conversations yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/chatbots/${id}/conversations/${conversation.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {conversation.visitor_id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(conversation.created_at).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
