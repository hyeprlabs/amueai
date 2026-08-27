import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
// Type-only import so the ingestion task's code (pdf-parse, mammoth,
// cheerio, embedMany) isn't bundled into this route handler.
import type { ingestSource } from "@/trigger/ingest-source";

// File uploads go to Storage client-side first (RLS-scoped to the org's
// own folder) - this route just records the storage_path and hands the
// pipeline off to Trigger.dev.
// Content caps aren't just tidiness - embedding cost scales with input
// size, and this route runs under a live Clerk session with no other
// throttle in front of it (Upstash only guards the public chat route).
const MAX_TEXT_CONTENT_LENGTH = 200_000;
const MAX_QA_PAIRS = 50;

const createSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    label: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(MAX_TEXT_CONTENT_LENGTH),
  }),
  z.object({
    type: z.literal("url"),
    label: z.string().trim().min(1).max(200),
    url: z.string().trim().url().max(2048),
  }),
  z.object({
    type: z.literal("qa"),
    label: z.string().trim().min(1).max(200),
    pairs: z
      .array(
        z.object({
          question: z.string().trim().min(1).max(2000),
          answer: z.string().trim().min(1).max(10_000),
        }),
      )
      .min(1)
      .max(MAX_QA_PAIRS),
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

  const raw_content =
    parsed.data.type === "text"
      ? parsed.data.content
      : parsed.data.type === "url"
        ? parsed.data.url
        : parsed.data.type === "qa"
          ? parsed.data.pairs.map((pair) => `Q: ${pair.question}\nA: ${pair.answer}`).join("\n\n")
          : null;

  if (parsed.data.type === "file") {
    // The ingestion pipeline downloads this path with the service-role
    // client, which bypasses Storage RLS entirely - without this check a
    // member could point storagePath at another org's uploaded file and
    // have it embedded into their own agent. Storage RLS already confines
    // uploads to `${orgId}/...`, so requiring that same prefix here ties
    // the path back to an object this org could actually have uploaded.
    if (!parsed.data.storagePath.startsWith(`${orgId}/`)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }
  }

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
