import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion";

// Sources are URL-only for now. Ingestion (Firecrawl scrape -> chunk ->
// embed -> store) runs inline, synchronously, before this route responds -
// a Firecrawl scrape plus embedding comfortably fits in one request; this
// just raises the ceiling past the Vercel Node function default.
export const maxDuration = 60;

const createSourceSchema = z.object({
  label: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(2048),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: agentId } = await params;

  const parsed = createSourceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { label, url } = parsed.data;

  const supabase = await createServerSupabaseClient();

  // RLS already scopes this to the active org; a miss means either the
  // agent doesn't exist or belongs to another org - either way, 404.
  const { data: agent } = await supabase.from("agents").select("id").eq("id", agentId).single();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const { data: source, error: insertError } = await supabase
    .from("sources")
    .insert({ org_id: orgId, agent_id: agentId, type: "url", label, raw_content: url })
    .select("id, label, status, created_at")
    .single();

  if (insertError || !source) {
    return NextResponse.json(
      { error: `Failed to create source: ${insertError?.message}` },
      { status: 500 },
    );
  }

  // Runs inline under the caller's own Clerk-scoped client - RLS already
  // permits this org member to read/write this agent's sources/chunks,
  // same as every other authenticated route. runIngestion sets the
  // source's status itself (processing -> ready/failed) and never throws
  // past this point in a way that should fail the request: the source row
  // already exists either way, so the response just reports whatever
  // state it landed in.
  await runIngestion(supabase, source.id).catch((err) => {
    console.error(`Inline ingestion failed for source ${source.id}`, err);
  });

  const { data: ingested } = await supabase
    .from("sources")
    .select("id, label, status, error_message, created_at")
    .eq("id", source.id)
    .single();

  return NextResponse.json({ source: ingested ?? source }, { status: 201 });
}
