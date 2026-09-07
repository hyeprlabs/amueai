import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { triggerIngestion } from "@/lib/trigger";

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
  z.object({
    type: z.literal("text"),
    label: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("qa"),
    label: z.string().trim().min(1).max(200),
    pairs: z.array(z.object({ q: z.string().trim().min(1), a: z.string().trim().min(1) })).min(1),
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

  const supabase = createServerSupabaseClient();

  const { data: agent } = await supabase.from("agents").select("id").eq("id", agentId).single();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const url = parsed.data.type === "url" ? parsed.data.url : null;
  const storage_path = parsed.data.type === "file" ? parsed.data.storagePath : null;
  const raw_content =
    parsed.data.type === "text"
      ? parsed.data.content
      : parsed.data.type === "qa"
        ? JSON.stringify(parsed.data.pairs)
        : null;

  const { data: source, error: insertError } = await supabase
    .from("sources")
    .insert({ org_id: orgId, agent_id: agentId, type, label, url, storage_path, raw_content })
    .select("id, label, type, status, created_at")
    .single();

  if (insertError || !source) {
    return NextResponse.json(
      { error: `Failed to create source: ${insertError?.message}` },
      { status: 500 },
    );
  }

  const run = await triggerIngestion(
    parsed.data.type === "url"
      ? { id: source.id, orgId, agentId, type: "url", url: parsed.data.url, label }
      : parsed.data.type === "file"
        ? {
            id: source.id,
            orgId,
            agentId,
            type: "file",
            storagePath: parsed.data.storagePath,
            label,
          }
        : parsed.data.type === "text"
          ? { id: source.id, orgId, agentId, type: "text", rawContent: parsed.data.content, label }
          : {
              id: source.id,
              orgId,
              agentId,
              type: "qa",
              rawContent: JSON.stringify(parsed.data.pairs),
              label,
            },
  );

  return NextResponse.json({ source, run }, { status: 201 });
}
