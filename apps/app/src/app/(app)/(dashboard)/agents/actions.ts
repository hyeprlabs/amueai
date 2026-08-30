"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AUTO_MODEL_ID, getGatewayChatModels } from "@/lib/gateway-models";
import { extractUrlBranding } from "@/lib/branding";
import { agentSettingsSchema } from "./[id]/settings/agent-settings-schema";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  system_prompt: z.string().trim().min(1).max(4000).optional(),
});

/**
 * Called directly (not via a <form action>) from the /new onboarding
 * wizard's client RHF form - returned rather than redirected, same
 * reasoning as updateAgent below, so the client stays in control of
 * navigation.
 */
export async function createAgent(input: unknown) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const { name, system_prompt } = createAgentSchema.parse(input);

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("agents")
    .insert({ org_id: orgId, name, ...(system_prompt ? { system_prompt } : {}) })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create agent: ${error.message}`);

  return data;
}

const captureBrandSchema = z.object({
  url: z.string().trim().url().max(2048),
});

/**
 * Scrapes the agent's source website for its visual identity and stores it
 * on the agent row. Called from the /new onboarding wizard right after the
 * agent is created, so an agent trained on a site also inherits that site's
 * name, logo and palette without anyone picking colors by hand.
 *
 * Resolves rather than throws when a site has no detectable brand - this
 * is an enhancement to onboarding, never a reason to fail it.
 */
export async function captureAgentBrand(agentId: string, input: unknown) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const { url } = captureBrandSchema.parse(input);

  const brand = await extractUrlBranding(url);
  if (!brand) return null;

  const supabase = await createServerSupabaseClient();
  // RLS scopes this to the caller's org, so a forged agentId from another
  // org matches no row and writes nothing.
  const { error } = await supabase.from("agents").update({ brand }).eq("id", agentId);
  if (error) throw new Error(`Failed to save brand: ${error.message}`);

  return brand;
}

const updateAgentSchema = agentSettingsSchema.partial();

/**
 * Called directly (not via a <form action>) from two separate client RHF
 * forms that each save a slice of the same agent row - the General
 * settings form (name + temperature) and the Playground's personality
 * panel (model + instructions) - which already validated `input` against
 * the matching picked schema. Accepting a partial payload here (rather
 * than requiring every field) is what lets those two forms stay
 * independent; re-validating at all isn't for a better client error, it's
 * because this is the actual trust boundary: a Server Action is a public
 * RPC endpoint, and the shape/model-id checks below still matter even
 * though a real client always sends valid data.
 */
export async function updateAgent(agentId: string, input: unknown) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const values = updateAgentSchema.parse(input);

  const supabase = await createServerSupabaseClient();

  // The dashboard only ever renders the Gateway's own model list (plus the
  // agent's current model, in case it's since been deprecated there) as
  // <select> options, but this action can still be called directly with
  // any string - only trust a submitted model id that's either live in
  // the Gateway catalog or already this agent's stored model.
  if (values.model !== undefined) {
    const { data: current } = await supabase
      .from("agents")
      .select("model")
      .eq("id", agentId)
      .single();
    const gatewayModels = await getGatewayChatModels();
    const isKnownModel =
      values.model === AUTO_MODEL_ID ||
      values.model === current?.model ||
      gatewayModels.some((model) => model.id === values.model);
    if (!isKnownModel) {
      throw new Error(`Unknown model: ${values.model}`);
    }
  }

  const { error } = await supabase.from("agents").update(values).eq("id", agentId);

  if (error) throw new Error(`Failed to update agent: ${error.message}`);

  // Returned (not redirected) - the form stays mounted and rebases its own
  // baseline with resetDefaultValues once this resolves.
  return values;
}

/**
 * Called directly (not via a <form action>) from DeleteAgentButton's
 * client handler, same reasoning as createAgent/updateAgent above: a
 * `redirect()` thrown from inside this action while the confirm dialog
 * is still open raced the dialog's own unmount/close-animation cleanup
 * and threw. The client closes the dialog first, then navigates once
 * this resolves.
 */
export async function deleteAgent(agentId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createServerSupabaseClient();

  // RLS scopes this to the active org, and sources/chunks/conversations/
  // messages all cascade on agents.id - deleting the agent row is enough.
  const { error } = await supabase.from("agents").delete().eq("id", agentId);
  if (error) throw new Error(`Failed to delete agent: ${error.message}`);
}
