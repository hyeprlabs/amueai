import "server-only";

import { auth, tasks } from "@trigger.dev/sdk";

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
