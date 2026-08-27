import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { sourceId } = await params;
  const supabase = await createServerSupabaseClient();

  // Chunks cascade-delete with the source (foreign key on delete cascade).
  const { error } = await supabase.from("sources").delete().eq("id", sourceId);
  if (error) {
    return NextResponse.json(
      { error: `Failed to delete source: ${error.message}` },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
