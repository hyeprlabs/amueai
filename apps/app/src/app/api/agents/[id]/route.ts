import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { agentSettingsSchema } from "@/components/dashboard/agents/agent-settings-schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateAgentSchema = agentSettingsSchema.partial();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: agent } = await supabase.from("agents").select("*").eq("id", id).single();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json(agent);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const parsed = updateAgentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: updated, error } = await supabase
    .from("agents")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: `Failed to update agent: ${error.message}` },
      { status: 500 },
    );
  }
  if (!updated) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json(parsed.data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: deleted, error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: `Failed to delete agent: ${error.message}` },
      { status: 500 },
    );
  }
  if (!deleted) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  revalidatePath("/agents", "layout");
  return new NextResponse(null, { status: 204 });
}
