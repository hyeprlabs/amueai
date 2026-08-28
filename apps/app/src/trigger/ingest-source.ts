import { logger, task } from "@trigger.dev/sdk";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion";

/**
 * Runs outside any Clerk session, so it uses the service-role client
 * throughout - the source/chunk rows are already stamped with org_id
 * explicitly (see lib/ingestion.ts), not defaulted from a JWT.
 *
 * trigger.config.ts points at the real project (proj_bhfgpttdkwfmnqrkslup).
 * This task still needs `npx trigger.dev@latest deploy` (or the GitHub
 * integration) before POST /sources' tasks.trigger() call has a worker to
 * hand off to - deferred for now. Retries come from trigger.config.ts's
 * defaults.
 */
export const ingestSource = task({
  id: "ingest-source",
  run: async (payload: { sourceId: string }, { ctx }) => {
    logger.log("Ingesting source", { sourceId: payload.sourceId, attempt: ctx.attempt.number });

    const supabase = createServiceRoleSupabaseClient();

    try {
      await runIngestion(supabase, payload.sourceId);
      logger.log("Source ingested", { sourceId: payload.sourceId });
    } catch (err) {
      // runIngestion already flips the source to `failed` with
      // error_message before rethrowing - this log just gets the failure
      // into the Trigger.dev run view alongside the retry it triggers.
      logger.error("Source ingestion failed", {
        sourceId: payload.sourceId,
        attempt: ctx.attempt.number,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});
