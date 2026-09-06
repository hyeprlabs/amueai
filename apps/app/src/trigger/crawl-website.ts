import { logger, task } from "@trigger.dev/sdk";

import { getFirecrawlClient } from "@/lib/firecrawl";
import { files } from "@/lib/storage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { processMarkdownSource } from "./process-markdown-source";

/**
 * Full-site crawl for a `url` source: Firecrawl discovers and scrapes every
 * page under the given URL, each page becomes its own `sources` child row
 * (parent_source_id pointing back at this root), and every page's markdown
 * is normalized and chunked through the same processMarkdownSource path
 * text/qa/file sources use. Trigger.dev tasks have no execution timeout, so
 * it's safe to await the crawl inline instead of juggling Firecrawl's
 * webhook/polling flow manually.
 */
export const crawlWebsite = task({
  id: "crawl-website",
  queue: { name: "crawling", concurrencyLimit: 3 },
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 2000, maxTimeoutInMs: 60000 },
  run: async (payload: { sourceId: string; orgId: string; agentId: string; url: string }) => {
    const supabase = createServiceRoleSupabaseClient();

    const { data: claimed } = await supabase
      .from("sources")
      .update({ status: "crawling" })
      .eq("id", payload.sourceId)
      .neq("status", "crawling")
      .select("id");
    if (!claimed || claimed.length === 0) {
      logger.log("Source already crawling, skipping", { sourceId: payload.sourceId });
      return;
    }

    const result = await getFirecrawlClient().crawl(payload.url, {
      limit: 200, // cap page count, tune per plan/site size
      maxDiscoveryDepth: 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    });

    if (result.status === "failed") {
      throw new Error(`Firecrawl crawl failed for ${payload.url}`);
    }

    const pages = result.data.filter(
      (page): page is typeof page & { markdown: string; metadata: { sourceURL: string } } =>
        !!page.markdown && !!page.metadata?.sourceURL,
    );

    // One `sources` child row per discovered page, upserted on the page URL
    // so a re-crawl updates existing pages instead of duplicating them.
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

    // Tagged with the ROOT source's tag (not each child page's own id) so
    // the dashboard's single useRealtimeRunsWithTag subscription on the
    // root source sees every page's processing run for "X/Y pages
    // processed" progress.
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
  onFailure: async ({ payload, error }) => {
    const supabase = createServiceRoleSupabaseClient();
    const message = error instanceof Error ? error.message : "Unknown crawl error";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", payload.sourceId);
  },
});
