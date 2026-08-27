import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion";

// All four source types now run inline (Phase 10 moves this off the
// request path into Trigger.dev). File uploads go to Storage client-side
// first (RLS-scoped to the org's own folder) - this route just records
// the storage_path and runs the pipeline against it.
const createSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    label: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("url"),
    label: z.string().trim().min(1).max(200),
    url: z.string().trim().url(),
  }),
  z.object({
    type: z.literal("qa"),
    label: z.string().trim().min(1).max(200),
    pairs: z
      .array(z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1) }))
      .min(1),
  }),
  z.object({
    type: z.literal("file"),
    label: z.string().trim().min(1).max(200),
    storagePath: z.string().trim().min(1),
  }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: chatbotId } = await params;

  const parsed = createSourceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { type, label } = parsed.data;

  const supabase = await createServerSupabaseClient();

  // RLS already scopes this to the active org; a miss means either the
  // chatbot doesn't exist or belongs to another org - either way, 404.
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id")
    .eq("id", chatbotId)
    .single();
  if (!chatbot) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

  const raw_content =
    parsed.data.type === "text"
      ? parsed.data.content
      : parsed.data.type === "url"
        ? parsed.data.url
        : parsed.data.type === "qa"
          ? parsed.data.pairs.map((pair) => `Q: ${pair.question}\nA: ${pair.answer}`).join("\n\n")
          : null;

  const storage_path = parsed.data.type === "file" ? parsed.data.storagePath : null;

  const { data: source, error: insertError } = await supabase
    .from("sources")
    .insert({ org_id: orgId, chatbot_id: chatbotId, type, label, raw_content, storage_path })
    .select("id, label, type, status, created_at")
    .single();

  if (insertError || !source) {
    return NextResponse.json(
      { error: `Failed to create source: ${insertError?.message}` },
      { status: 500 },
    );
  }

  try {
    await runIngestion(supabase, source.id);
  } catch (err) {
    // Ingestion failure is recorded on the source row (status/error_message)
    // by runIngestion itself - still return 201, the client should just
    // reflect the failed status rather than treat the request as failed.
    console.error(`Ingestion failed for source ${source.id}:`, err);
  }

  const { data: finalSource } = await supabase
    .from("sources")
    .select("id, label, type, status, error_message, created_at")
    .eq("id", source.id)
    .single();

  return NextResponse.json({ source: finalSource ?? source }, { status: 201 });
}
