import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion";

// See the sources route for why ingestion runs inline.
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
    .select("id")
    .eq("id", sourceId)
    .eq("agent_id", agentId)
    .single();
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  // runIngestion never flips status to ready on partial success, and
  // keeps this source's existing chunks in place until the new run's
  // insert succeeds - a failed retrain doesn't blank out a working agent.
  await runIngestion(supabase, sourceId).catch((err) => {
    console.error(`Inline retrain failed for source ${sourceId}`, err);
  });

  return NextResponse.json({ ok: true });
}
