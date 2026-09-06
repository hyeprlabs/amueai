import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { triggerIngestion } from "@/lib/trigger";

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
    .select("id, type, label, url, storage_path, raw_content")
    .eq("id", sourceId)
    .eq("agent_id", agentId)
    .single();
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  // A retrained text/qa source has no raw_content left (cleared once its
  // canonical markdown was written the first time) - re-extraction for
  // those types isn't meaningful since there's no original input to
  // re-normalize; only file (re-parse) and url (re-crawl) support retrain.
  if (source.type === "text" || source.type === "qa") {
    return NextResponse.json(
      { error: `${source.type} sources can't be retrained - delete and re-add instead` },
      { status: 400 },
    );
  }
  if (source.type === "file" && !source.storage_path) {
    return NextResponse.json({ error: "Source has no uploaded file" }, { status: 400 });
  }
  if (source.type === "url" && !source.url) {
    return NextResponse.json({ error: "Source has no URL" }, { status: 400 });
  }

  // ingest-source/crawl-website never flip status to ready on partial
  // success, and keep this source's existing chunks in place until the new
  // run's insert succeeds - a failed retrain doesn't blank out a working
  // agent.
  const run = await triggerIngestion(
    source.type === "file"
      ? {
          id: source.id,
          orgId,
          agentId,
          type: "file",
          storagePath: source.storage_path!,
          label: source.label,
        }
      : { id: source.id, orgId, agentId, type: "url", url: source.url!, label: source.label },
  );

  return NextResponse.json({ ok: true, run });
}
