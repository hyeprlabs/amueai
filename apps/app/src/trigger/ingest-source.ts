import { logger, task } from "@trigger.dev/sdk";

import { runIngestion } from "@/lib/ingestion";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Runs outside any Clerk session, so it uses the service-role client
 * throughout - the source/chunk rows are already stamped with org_id
 * explicitly (see lib/ingestion.ts), not defaulted from a JWT. Retries come
 * from trigger.config.ts's defaults; runIngestion itself already leaves the
 * source in a well-defined `failed` state with its prior chunks intact on
 * any error, so a retry re-runs the same extract -> chunk -> embed -> store
 * pipeline from scratch.
 *
 * PLACEHOLDER task id/config - re-verify against the real Trigger.dev
 * project once `trigger.config.ts`'s project ref is filled in.
 */
export const ingestSource = task({
  id: "ingest-source",
  run: async (payload: { sourceId: string }) => {
    logger.log("Ingesting source", { sourceId: payload.sourceId });

    const supabase = createServiceRoleSupabaseClient();
    await runIngestion(supabase, payload.sourceId);
  },
});
