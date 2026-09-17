import Firecrawl from "@mendable/firecrawl-js";
import { logger, task } from "@trigger.dev/sdk";

import { crawlWebsite } from "./crawl-website";
import { processMarkdownSource } from "./process-markdown-source";
import { claimSource, markFailed, updateSource, type SourceRef } from "./shared/source";
import { files, markdownKey } from "./shared/storage";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

type ClaimedSource = NonNullable<Awaited<ReturnType<typeof claimSource>>>;

async function toMarkdown(source: ClaimedSource) {
  if (source.type === "text") return `# ${source.label}\n\n${source.raw_content}`;

  if (source.type === "qa") {
    const pairs = JSON.parse(source.raw_content ?? "[]") as { q: string; a: string }[];
    return pairs.map(({ q, a }) => `## ${q}\n\n${a}`).join("\n\n");
  }

  const file = await files.download(source.storage_path!);
  const { markdown } = await firecrawl.parse(
    { data: await file.blob(), filename: file.name, contentType: file.type || undefined },
    { formats: ["markdown"] },
  );
  if (!markdown) throw new Error(`Firecrawl found no content in ${source.storage_path}`);

  return markdown;
}

export const ingestSource = task({
  id: "ingest-source",
  queue: { name: "ingestion", concurrencyLimit: 5 },
  run: async (ref: SourceRef) => {
    const source = await claimSource(ref.sourceId);
    if (!source) return logger.log("Already ingesting", { sourceId: ref.sourceId });

    const tags = [`source:${ref.sourceId}`];

    if (source.type === "url") {
      await crawlWebsite.triggerAndWait({ ...ref, url: source.url! }, { tags }).unwrap();
      return;
    }

    await files.upload(markdownKey(ref), await toMarkdown(source));
    await updateSource(ref.sourceId, { raw_content: null });
    await processMarkdownSource.triggerAndWait(ref, { tags }).unwrap();
  },
  onFailure: ({ payload, error }) => markFailed(payload.sourceId, error),
});
