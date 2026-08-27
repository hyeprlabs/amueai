"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOrganizationRow } from "@/lib/organizations";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});

export async function createAgent(formData: FormData) {
  const { orgId, orgSlug } = await auth();
  if (!orgId) throw new Error("No active organization");

  const { name } = createAgentSchema.parse({ name: formData.get("name") });

  const supabase = await createServerSupabaseClient();
  await ensureOrganizationRow(supabase, orgId, orgSlug ?? orgId);

  const { data, error } = await supabase
    .from("agents")
    .insert({ org_id: orgId, name })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create agent: ${error.message}`);

  redirect(`/agents/${data.id}`);
}

const updateAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  system_prompt: z.string().trim().min(1, "System prompt is required").max(4000),
  model: z.string().trim().min(1),
  temperature: z.coerce.number().min(0).max(2),
});

export async function updateAgent(agentId: string, formData: FormData) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const values = updateAgentSchema.parse({
    name: formData.get("name"),
    system_prompt: formData.get("system_prompt"),
    model: formData.get("model"),
    temperature: formData.get("temperature"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("agents").update(values).eq("id", agentId);

  if (error) throw new Error(`Failed to update agent: ${error.message}`);

  redirect(`/agents/${agentId}`);
}
