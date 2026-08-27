import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: agentId, sourceId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: source } = await supabase
    .from("sources")
    .select("storage_path")
    .eq("id", sourceId)
    .eq("agent_id", agentId)
    .single();
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  // Chunks cascade-delete with the source (foreign key on delete cascade).
  const { error } = await supabase
    .from("sources")
    .delete()
    .eq("id", sourceId)
    .eq("agent_id", agentId);
  if (error) {
    return NextResponse.json(
      { error: `Failed to delete source: ${error.message}` },
      { status: 500 },
    );
  }

  // Best-effort: the DB row is already gone either way, so a storage
  // failure here shouldn't turn into a user-facing error - it'd just
  // leave an orphaned blob rather than an orphaned row.
  if (source.storage_path) {
    await supabase.storage.from("sources").remove([source.storage_path]);
  }

  return new NextResponse(null, { status: 204 });
}
