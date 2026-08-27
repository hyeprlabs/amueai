import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

/**
 * There's no Clerk `organization.created` webhook wired up yet, so the
 * `organizations` row (this project's pre-existing org metadata/billing
 * mirror, keyed by `clerk_org_id`) is lazily created the first time a
 * member touches it. Safe to call on every request that needs it — it
 * only inserts when the row is missing.
 */
export async function ensureOrganizationRow(
  supabase: SupabaseClient<Database>,
  orgId: string,
  orgName: string,
) {
  const { error } = await supabase
    .from("organizations")
    .upsert(
      { clerk_org_id: orgId, name: orgName },
      { onConflict: "clerk_org_id", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`Failed to ensure organization row for ${orgId}: ${error.message}`);
  }
}
