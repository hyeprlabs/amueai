"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGatewayChatModels } from "@/lib/gateway-models";
import { agentSettingsSchema } from "./[id]/settings/agent-settings-schema";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});

/**
 * Called directly (not via a <form action>) from the client RHF form in
 * create-agent-dialog.tsx - returned rather than redirected, same reasoning
 * as updateAgent below, so the client stays in control of navigation.
 */
export async function createAgent(input: unknown) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const { name } = createAgentSchema.parse(input);

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("agents")
    .insert({ org_id: orgId, name })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create agent: ${error.message}`);

  return data;
}

/**
 * Called directly (not via a <form action>) from the client RHF form in
 * agent-settings-form.tsx, which already validated `input` against the
 * same agentSettingsSchema - re-validating here isn't for a better client
 * error, it's because this is the actual trust boundary: a Server Action
 * is a public RPC endpoint, and the shape/model-id checks below still
 * matter even though a real client always sends valid data.
 */
export async function updateAgent(agentId: string, input: unknown) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const values = agentSettingsSchema.parse(input);

  const supabase = await createServerSupabaseClient();

  // The dashboard only ever renders the Gateway's own model list (plus the
  // agent's current model, in case it's since been deprecated there) as
  // <select> options, but this action can still be called directly with
  // any string - only trust a submitted model id that's either live in
  // the Gateway catalog or already this agent's stored model.
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

  // Returned (not redirected) - the form stays mounted and rebases its own
  // baseline with resetDefaultValues once this resolves.
  return values;
}

export async function deleteAgent(agentId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createServerSupabaseClient();

  // RLS scopes this to the active org, and sources/chunks/conversations/
  // messages all cascade on agents.id - deleting the agent row is enough.
  const { error } = await supabase.from("agents").delete().eq("id", agentId);
  if (error) throw new Error(`Failed to delete agent: ${error.message}`);

  redirect("/agents");
}
