import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/supabase";

export type SourceRef = { sourceId: string; orgId: string; agentId: string };

export const db = createServiceRoleSupabaseClient;

export async function claimSource(sourceId: string) {
  const { data } = await db()
    .from("sources")
    .update({ status: "processing" })
    .eq("id", sourceId)
    .neq("status", "processing")
    .select("type, label, url, storage_path, raw_content")
    .maybeSingle();

  return data;
}

export async function updateSource(sourceId: string, values: TablesUpdate<"sources">) {
  await db().from("sources").update(values).eq("id", sourceId);
}

export function markFailed(sourceId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return updateSource(sourceId, { status: "failed", error_message: message });
}
