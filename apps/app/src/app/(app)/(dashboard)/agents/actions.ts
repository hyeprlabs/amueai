"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGatewayChatModels } from "@/lib/gateway-models";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});

export async function createAgent(formData: FormData) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const { name } = createAgentSchema.parse({ name: formData.get("name") });

  const supabase = await createServerSupabaseClient();

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

  // The dashboard only ever renders the Gateway's own model list (plus the
  // agent's current model, in case it's since been deprecated there) as
  // <select> options, but a form POST can be forged with any string - only
  // trust a submitted model id that's either live in the Gateway catalog or
  // already this agent's stored model.
  const { data: current } = await supabase
    .from("agents")
    .select("model")
    .eq("id", agentId)
    .single();
  const gatewayModels = await getGatewayChatModels();
  const isKnownModel =
    values.model === current?.model || gatewayModels.some((model) => model.id === values.model);
  if (!isKnownModel) {
    throw new Error(`Unknown model: ${values.model}`);
  }

  const { error } = await supabase.from("agents").update(values).eq("id", agentId);

  if (error) throw new Error(`Failed to update agent: ${error.message}`);

  redirect(`/agents/${agentId}`);
}
