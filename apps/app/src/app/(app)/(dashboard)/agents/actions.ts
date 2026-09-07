"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractUrlBranding } from "@/lib/branding";

const captureBrandSchema = z.object({
  url: z.string().trim().url().max(2048),
});

export async function captureAgentBrand(agentId: string, input: unknown) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");

  const { url } = captureBrandSchema.parse(input);

  const brand = await extractUrlBranding(url);
  if (!brand) return null;

  const supabase = await createServerSupabaseClient();
  const { data: updated, error } = await supabase
    .from("agents")
    .update({ brand })
    .eq("id", agentId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Failed to save brand: ${error.message}`);
  if (!updated) {
    throw new Error("Agent not found - it may have been deleted or belong to another workspace.");
  }

  return brand;
}
