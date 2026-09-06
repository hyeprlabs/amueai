import "server-only";

import { auth, tasks } from "@trigger.dev/sdk";

// Type-only imports so the tasks' own code (Firecrawl, embedMany, files-sdk)
// isn't bundled into whatever route calls this - they run on Trigger.dev's
// infrastructure, not here. `tasks.trigger<typeof T>("task-id", ...)` gives
// full payload typing from a type-only import; calling `.trigger()` on the
// task object directly would require a value import and pull its code in.
import type { crawlWebsite } from "@/trigger/crawl-website";
import type { ingestSource } from "@/trigger/ingest-source";

type TriggerableSource =
  | {
      id: string;
      orgId: string;
      agentId: string;
      type: "text" | "qa";
      rawContent: string;
      label: string;
    }
  | { id: string; orgId: string; agentId: string; type: "file"; storagePath: string; label: string }
  | { id: string; orgId: string; agentId: string; type: "url"; url: string; label: string };

/**
 * Enqueues the right task for a source's type - crawl-website for url
 * (full-site crawl, many child pages), ingest-source for everything else
 * (one markdown doc) - and mints a Public Access Token scoped to this
 * source's tag rather than a single run id. Tag-based (not run-id-based)
 * because a url source's crawl fans out into many child-page
 * processMarkdownSource runs that all carry this same tag; the dashboard
 * subscribes once with `useRealtimeRunsWithTag` and gets live status across
 * all of them, which a single-run token couldn't express.
 */
export async function triggerIngestion(source: TriggerableSource) {
  const tag = `source:${source.id}`;
  const commonOptions = {
    tags: [`org:${source.orgId}`, `agent:${source.agentId}`, tag],
  };

  if (source.type === "url") {
    await tasks.trigger<typeof crawlWebsite>(
      "crawl-website",
      { sourceId: source.id, orgId: source.orgId, agentId: source.agentId, url: source.url },
      { ...commonOptions, idempotencyKey: `crawl-${source.id}-v1`, idempotencyKeyTTL: "10m" },
    );
  } else if (source.type === "file") {
    await tasks.trigger<typeof ingestSource>(
      "ingest-source",
      {
        sourceId: source.id,
        orgId: source.orgId,
        agentId: source.agentId,
        type: source.type,
        storagePath: source.storagePath,
        label: source.label,
      },
      { ...commonOptions, idempotencyKey: `source-${source.id}-v1`, idempotencyKeyTTL: "10m" },
    );
  } else {
    await tasks.trigger<typeof ingestSource>(
      "ingest-source",
      {
        sourceId: source.id,
        orgId: source.orgId,
        agentId: source.agentId,
        type: source.type,
        rawContent: source.rawContent,
        label: source.label,
      },
      { ...commonOptions, idempotencyKey: `source-${source.id}-v1`, idempotencyKeyTTL: "10m" },
    );
  }

  const publicAccessToken = await auth.createPublicToken({
    scopes: { read: { tags: [tag] } },
    expirationTime: "1h",
  });

  return { tag, publicAccessToken };
}
