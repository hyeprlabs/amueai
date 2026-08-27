import { logger, task } from "@trigger.dev/sdk";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion";

/**
 * Runs outside any Clerk session, so it uses the service-role client
 * throughout - the source/chunk rows are already stamped with org_id
 * explicitly (see lib/ingestion.ts), not defaulted from a JWT.
 *
 * PLACEHOLDER task id/config - re-verify against the real Trigger.dev
 * project once the MCP connector or CLI login is available (see the
 * build summary). Retries come from trigger.config.ts's defaults.
 */
export const ingestSource = task({
  id: "ingest-source",
  run: async (payload: { sourceId: string }) => {
    logger.log("Ingesting source", { sourceId: payload.sourceId });

    const supabase = createServiceRoleSupabaseClient();
    await runIngestion(supabase, payload.sourceId);
  },
});
