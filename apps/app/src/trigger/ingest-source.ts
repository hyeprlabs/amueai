import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import Firecrawl from "@mendable/firecrawl-js";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { processMarkdownSource } from "./process-markdown-source";
import { claim, markFailed } from "./shared";
import { files } from "./storage";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

type IngestSourcePayload =
  | {
      sourceId: string;
      orgId: string;
      agentId: string;
      type: "text" | "qa";
      rawContent: string;
      label: string;
    }
  | {
      sourceId: string;
      orgId: string;
      agentId: string;
      type: "file";
      storagePath: string;
      label: string;
    };

export const ingestSource = task({
  id: "ingest-source",
  queue: { name: "ingestion", concurrencyLimit: 5 },
  retry: { maxAttempts: 4, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 20000 },
  run: async (payload: IngestSourcePayload) => {
    const supabase = createServiceRoleSupabaseClient();
    if (!(await claim(supabase, payload.sourceId, "processing"))) {
      logger.log("Source already being processed, skipping", { sourceId: payload.sourceId });
      return;
    }

    let markdown: string;
    if (payload.type === "text") {
      markdown = `# ${payload.label}\n\n${payload.rawContent}`;
    } else if (payload.type === "qa") {
      const pairs = JSON.parse(payload.rawContent) as { q: string; a: string }[];
      markdown = pairs.map((pair) => `## ${pair.q}\n\n${pair.a}`).join("\n\n");
    } else if (payload.type === "file") {
      const stored = await files.download(payload.storagePath);
      const blob = await stored.blob();
      const document = await firecrawl.parse(
        { data: blob, filename: stored.name, contentType: stored.type || undefined },
        { formats: ["markdown"] },
      );
      if (!document.markdown) {
        throw new Error(`Firecrawl returned no content for ${payload.storagePath}`);
      }
      markdown = document.markdown;
    } else {
      throw new AbortTaskRunError(
        `Unsupported type for ingest-source: ${(payload as { type: string }).type}`,
      );
    }

    const markdownPath = `${payload.orgId}/${payload.agentId}/${payload.sourceId}.md`;
    await files.upload(markdownPath, markdown);
    await supabase
      .from("sources")
      .update({ markdown_path: markdownPath, raw_content: null })
      .eq("id", payload.sourceId);

    await processMarkdownSource
      .triggerAndWait(
        { sourceId: payload.sourceId, orgId: payload.orgId, markdownPath },
        { tags: [`source:${payload.sourceId}`] },
      )
      .unwrap();
  },
  onFailure: async ({ payload, error }) => markFailed(payload.sourceId, error),
});
