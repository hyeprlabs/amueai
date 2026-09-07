import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  system_prompt: z.string().trim().min(1).max(4000).optional(),
});

export async function POST(request: Request) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = createAgentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { name, system_prompt } = parsed.data;

  const supabase = createServerSupabaseClient();
  const { data: agent, error } = await supabase
    .from("agents")
    .insert({ org_id: orgId, name, ...(system_prompt ? { system_prompt } : {}) })
    .select("id")
    .single();
  if (error)
    return NextResponse.json(
      { error: `Failed to create agent: ${error.message}` },
      { status: 500 },
    );

  return NextResponse.json(agent, { status: 201 });
}
