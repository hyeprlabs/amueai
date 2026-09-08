import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function claim(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  sourceId: string,
  status: "processing" | "crawling",
) {
  const { data } = await supabase
    .from("sources")
    .update({ status })
    .eq("id", sourceId)
    .neq("status", status)
    .select("id");
  return (data?.length ?? 0) > 0;
}

export async function markFailed(sourceId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  await createServiceRoleSupabaseClient()
    .from("sources")
    .update({ status: "failed", error_message: message })
    .eq("id", sourceId);
}
