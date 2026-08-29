import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = createMetadata({
  title: "Analytics",
  description: "Conversation activity for this agent.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentAnalyticsPage({ params }: PageProps<"/agents/[id]/analytics">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase.from("agents").select("id, name").eq("id", id).single();
  if (!agent) notFound();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, visitor_id, created_at")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  const { count: sourceCount } = await supabase
    .from("sources")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id);

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Analytics</h1>
        <p className="text-sm text-muted-foreground">Conversation activity for {agent.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{conversations?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sourceCount ?? 0}</p>
          </CardContent>
        </Card>
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
                href={`/agents/${id}/analytics/${conversation.id}`}
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
