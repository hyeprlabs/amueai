import "server-only";

import { auth, tasks } from "@trigger.dev/sdk";

// Type-only import so the ingestion task's code (Firecrawl, embedMany)
// isn't bundled into whatever route calls this - the task runs on
// Trigger.dev's infrastructure, not here.
import type { ingestSource } from "@/trigger/ingest-source";

/**
 * Enqueues the ingest-source task and mints a scoped Public Access Token
 * for its run, so the client can subscribe to live status via
 * `useRealtimeRun` (per Trigger.dev's own realtime pattern) instead of
 * relying solely on Supabase Realtime to reflect the DB write. The token
 * is scoped to read-only access on this one run - it cannot trigger
 * anything or read any other run.
 */
export async function triggerIngestSource(sourceId: string) {
  const handle = await tasks.trigger<typeof ingestSource>("ingest-source", { sourceId });
  const publicAccessToken = await auth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
  });
  return { id: handle.id, publicAccessToken };
}
