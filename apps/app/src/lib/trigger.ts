import "server-only";

import { auth, tasks } from "@trigger.dev/sdk";

import type { ingestSource } from "@/trigger/ingest-source";

export async function triggerIngestion(source: { id: string; orgId: string; agentId: string }) {
  const tag = `source:${source.id}`;

  await tasks.trigger<typeof ingestSource>(
    "ingest-source",
    { sourceId: source.id, orgId: source.orgId, agentId: source.agentId },
    {
      tags: [`org:${source.orgId}`, `agent:${source.agentId}`, tag],
      idempotencyKey: `source-${source.id}-v1`,
      idempotencyKeyTTL: "10m",
    },
  );

  const publicAccessToken = await auth.createPublicToken({
    scopes: { read: { tags: [tag] } },
    expirationTime: "1h",
  });

  return { tag, publicAccessToken };
}
