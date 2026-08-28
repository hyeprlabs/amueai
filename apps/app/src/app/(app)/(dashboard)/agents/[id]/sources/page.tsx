import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddSourceDialog } from "./add-source-form";
import { SourcesList } from "./sources-list";

export const metadata: Metadata = createMetadata({
  title: "Sources",
  description: "The URLs this agent is trained on.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentSourcesPage({ params }: PageProps<"/agents/[id]/sources">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: sources } = await supabase
    .from("sources")
    .select("id, label, status, error_message, created_at")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Sources</CardTitle>
            <CardDescription>
              Add a URL — Firecrawl scrapes it and it&apos;s embedded right away.
            </CardDescription>
          </div>
          <AddSourceDialog agentId={id} />
        </div>
      </CardHeader>
      <CardContent>
        <SourcesList agentId={id} initialSources={sources ?? []} />
      </CardContent>
    </Card>
  );
}
