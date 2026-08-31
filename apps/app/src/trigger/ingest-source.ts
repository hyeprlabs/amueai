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
 * This task runs on Trigger.dev's own infrastructure, not Vercel's - env
 * vars set on the Vercel project (NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SECRET_KEY, FIRECRAWL_API_KEY, AI_GATEWAY_API_KEY) do not reach
 * it. They must also be set directly on the Trigger.dev project (per
 * environment - dev/staging/prod), either via the dashboard or
 * `POST /api/v1/projects/:ref/envvars/:env/import` (what `env list`/`env
 * set` under the hood use; the CLI itself has no `env set` command).
 */
export const ingestSource = task({
  id: "ingest-source",
  run: async (payload: { sourceId: string }) => {
    logger.log("Ingesting source", { sourceId: payload.sourceId });

    const supabase = createServiceRoleSupabaseClient();
    await runIngestion(supabase, payload.sourceId);
  },
});
