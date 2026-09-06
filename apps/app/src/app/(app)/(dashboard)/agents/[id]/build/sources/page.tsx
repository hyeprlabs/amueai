import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { SourcesPanel } from "@/components/dashboard/agents/sources-panel";

export const metadata: Metadata = createMetadata({
  title: "Sources",
  description: "The URLs this agent is trained on.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentSourcesPage({
  params,
}: PageProps<"/agents/[id]/build/sources">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: sources } = await supabase
    .from("sources")
    .select("id, label, status, error_message, created_at")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  return <SourcesPanel agentId={id} initialSources={sources ?? []} />;
}
