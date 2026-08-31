import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
// Type-only import so the ingestion task's code (Firecrawl, embedMany)
// isn't bundled into this route handler - the task runs on Trigger.dev's
// infrastructure, not here.
import type { ingestSource } from "@/trigger/ingest-source";

// File uploads go to the "sources" Storage bucket client-side first
// (RLS-scoped to the org's own folder) - this route just records the
// storage_path and hands the pipeline off to Trigger.dev. Either way the
// route returns as soon as the source row is queued; ingestion runs in the
// background and the sources table reflects real status via Realtime.
const createSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    label: z.string().trim().min(1).max(200),
    url: z.string().trim().url().max(2048),
  }),
  z.object({
    type: z.literal("file"),
    label: z.string().trim().min(1).max(200),
    storagePath: z.string().trim().min(1).max(1024),
  }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: agentId } = await params;

  const parsed = createSourceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { type, label } = parsed.data;

  const supabase = await createServerSupabaseClient();

  // RLS already scopes this to the active org; a miss means either the
  // agent doesn't exist or belongs to another org - either way, 404.
  const { data: agent } = await supabase.from("agents").select("id").eq("id", agentId).single();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const raw_content = parsed.data.type === "url" ? parsed.data.url : null;
  const storage_path = parsed.data.type === "file" ? parsed.data.storagePath : null;

  const { data: source, error: insertError } = await supabase
    .from("sources")
    .insert({ org_id: orgId, agent_id: agentId, type, label, raw_content, storage_path })
    .select("id, label, type, status, created_at")
    .single();

  if (insertError || !source) {
    return NextResponse.json(
      { error: `Failed to create source: ${insertError?.message}` },
      { status: 500 },
    );
  }

  await tasks.trigger<typeof ingestSource>("ingest-source", { sourceId: source.id });

  return NextResponse.json({ source }, { status: 201 });
}
