import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion";
import type { ingestSource } from "@/trigger/ingest-source";

// See the sources route for why text/url retrains run inline rather than
// through Trigger.dev.
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: agentId, sourceId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: source } = await supabase
    .from("sources")
    .select("id, type")
    .eq("id", sourceId)
    .eq("agent_id", agentId)
    .single();
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  // ingestSource/runIngestion never flip status to ready on partial
  // success, and keep this source's existing chunks in place until the
  // new run's insert succeeds - a failed retrain doesn't blank out a
  // working agent.
  if (source.type === "text" || source.type === "url") {
    await runIngestion(supabase, sourceId).catch((err) => {
      console.error(`Inline retrain failed for source ${sourceId}`, err);
    });
    return NextResponse.json({ ok: true });
  }

  await tasks.trigger<typeof ingestSource>(
    "ingest-source",
    { sourceId },
    { tags: [`org:${orgId}`, `agent:${agentId}`, `source:${sourceId}`] },
  );

  return NextResponse.json({ ok: true });
}
