import { logger, task } from "@trigger.dev/sdk";
import Firecrawl from "@mendable/firecrawl-js";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { processMarkdownSource } from "../process-markdown-source";
import { claim, markFailed } from "../shared/status";
import { files } from "../shared/storage";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

export const crawlWebsite = task({
  id: "crawl-website",
  queue: { name: "crawling", concurrencyLimit: 3 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 60000 },
  run: async (payload: { sourceId: string; orgId: string; agentId: string; url: string }) => {
    const supabase = createServiceRoleSupabaseClient();
    if (!(await claim(supabase, payload.sourceId, "crawling"))) {
      logger.log("Source already crawling, skipping", { sourceId: payload.sourceId });
      return;
    }

    const result = await firecrawl.crawl(payload.url, {
      limit: 200,
      maxDiscoveryDepth: 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    });
    if (result.status === "failed") throw new Error(`Firecrawl crawl failed for ${payload.url}`);

    const pages = result.data.filter(
      (page): page is typeof page & { markdown: string; metadata: { sourceURL: string } } =>
        !!page.markdown && !!page.metadata?.sourceURL,
    );

    const { data: upserted, error: upsertError } = await supabase
      .from("sources")
      .upsert(
        pages.map((page) => ({
          org_id: payload.orgId,
          agent_id: payload.agentId,
          parent_source_id: payload.sourceId,
          type: "url" as const,
          label: page.metadata.title ?? page.metadata.sourceURL,
          url: page.metadata.sourceURL,
          status: "processing" as const,
        })),
        { onConflict: "agent_id,url" },
      )
      .select("id, url");
    if (upsertError || !upserted) {
      throw new Error(`Failed to store discovered pages: ${upsertError?.message}`);
    }

    await Promise.all(
      pages.map(async (page) => {
        const child = upserted.find((row) => row.url === page.metadata.sourceURL);
        if (!child) return;
        const markdownPath = `${payload.orgId}/${payload.agentId}/${child.id}.md`;
        await files.upload(markdownPath, page.markdown);
        await supabase.from("sources").update({ markdown_path: markdownPath }).eq("id", child.id);
      }),
    );

    await processMarkdownSource.batchTriggerAndWait(
      upserted.map((child) => ({
        payload: {
          sourceId: child.id,
          orgId: payload.orgId,
          markdownPath: `${payload.orgId}/${payload.agentId}/${child.id}.md`,
        },
        options: { tags: [`source:${payload.sourceId}`] },
      })),
    );

    await supabase
      .from("sources")
      .update({ status: "ready", last_crawled_at: new Date().toISOString() })
      .eq("id", payload.sourceId);
  },
  onFailure: async ({ payload, error }) => markFailed(payload.sourceId, error),
});
