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
  const supabase = createServerSupabaseClient();

  const { data: source } = await supabase
    .from("sources")
    .select("storage_path")
    .eq("id", sourceId)
    .eq("agent_id", agentId)
    .single();

  const { error, count } = await supabase
    .from("sources")
    .delete({ count: "exact" })
    .eq("id", sourceId)
    .eq("agent_id", agentId);

  if (error) {
    return NextResponse.json(
      { error: `Failed to delete source: ${error.message}` },
      { status: 500 },
    );
  }
  if (!count) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  if (source?.storage_path) {
    await supabase.storage.from("sources").remove([source.storage_path]);
  }

  return new NextResponse(null, { status: 204 });
}
