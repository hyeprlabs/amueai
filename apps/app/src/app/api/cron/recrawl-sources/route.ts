import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { crawlWebsite } from "@/trigger/tasks";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: rootUrlSources } = await supabase
    .from("sources")
    .select("id, org_id, agent_id, url")
    .eq("type", "url")
    .is("parent_source_id", null);

  const isoWeek = new Date().toISOString().slice(0, 10);

  await tasks.batchTrigger<typeof crawlWebsite>(
    "crawl-website",
    (rootUrlSources ?? [])
      .filter((source) => !!source.url)
      .map((source) => ({
        payload: {
          sourceId: source.id,
          orgId: source.org_id,
          agentId: source.agent_id,
          url: source.url!,
        },
        options: {
          idempotencyKey: `recrawl-${source.id}-${isoWeek}`,
          idempotencyKeyTTL: "7d",
          tags: [
            `org:${source.org_id}`,
            `agent:${source.agent_id}`,
            `source:${source.id}`,
            "recrawl",
          ],
        },
      })),
  );

  return NextResponse.json({ triggered: rootUrlSources?.length ?? 0 });
}
