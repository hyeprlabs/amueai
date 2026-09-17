import Firecrawl from "@mendable/firecrawl-js";
import { task } from "@trigger.dev/sdk";

import { processMarkdownSource } from "../process-markdown-source";
import { db, markFailed, updateSource, type SourceRef } from "../shared/source";
import { files, markdownKey } from "../shared/storage";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

export const crawlWebsite = task({
  id: "crawl-website",
  queue: { name: "crawling", concurrencyLimit: 3 },
  retry: { maxAttempts: 3, minTimeoutInMs: 5000, maxTimeoutInMs: 60000 },
  run: async ({ url, ...ref }: SourceRef & { url: string }) => {
    await updateSource(ref.sourceId, { status: "crawling" });

    const crawl = await firecrawl.crawl(url, {
      limit: 200,
      maxDiscoveryDepth: 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    });
    if (crawl.status === "failed") throw new Error(`Crawl failed for ${url}`);

    const pages = crawl.data.flatMap((page) =>
      page.markdown && page.metadata?.sourceURL
        ? [{ markdown: page.markdown, url: page.metadata.sourceURL, title: page.metadata.title }]
        : [],
    );

    const { data: children, error } = await db()
      .from("sources")
      .upsert(
        pages.map((page) => ({
          org_id: ref.orgId,
          agent_id: ref.agentId,
          parent_source_id: ref.sourceId,
          type: "url",
          status: "processing",
          label: page.title ?? page.url,
          url: page.url,
        })),
        { onConflict: "agent_id,url" },
      )
      .select("id, url");
    if (error) throw new Error(`Failed to store crawled pages: ${error.message}`);

    const idByUrl = new Map(children.map((child) => [child.url, child.id]));
    await Promise.all(
      pages.map(async (page) => {
        const sourceId = idByUrl.get(page.url);
        if (sourceId) await files.upload(markdownKey({ ...ref, sourceId }), page.markdown);
      }),
    );

    await processMarkdownSource.batchTriggerAndWait(
      children.map((child) => ({
        payload: { ...ref, sourceId: child.id },
        options: { tags: [`source:${ref.sourceId}`] },
      })),
    );

    await updateSource(ref.sourceId, {
      status: "ready",
      last_crawled_at: new Date().toISOString(),
    });
  },
  onFailure: ({ payload, error }) => markFailed(payload.sourceId, error),
});
