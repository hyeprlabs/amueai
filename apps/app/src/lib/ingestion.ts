import "server-only";

import { embedMany } from "ai";
import Firecrawl from "@mendable/firecrawl-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;
const EMBED_BATCH_SIZE = 100;
const URL_FETCH_TIMEOUT_MS = 30_000;

let firecrawlClient: Firecrawl | undefined;

/**
 * Firecrawl owns fetching and parsing for every source type: for URLs it
 * fetches from its own infrastructure (SSRF protection, JS rendering,
 * anti-bot handling included) via `/scrape`; for uploaded files it parses
 * the bytes we hand it via `/parse`. No hand-rolled fetch/cheerio crawler
 * or PDF/Office parsing library anywhere in this app.
 */
export function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
    firecrawlClient = new Firecrawl({ apiKey });
  }
  return firecrawlClient;
}

/**
 * Splits raw text into chunks on paragraph boundaries, hard-wrapping any
 * paragraph longer than ~1000 tokens (~4000 chars) with ~100-token
 * (~400-char) overlap. Deliberately simple for MVP.
 */
export function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= CHUNK_SIZE) {
      chunks.push(paragraph);
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + CHUNK_SIZE, paragraph.length);
      chunks.push(paragraph.slice(start, end));
      if (end === paragraph.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }

  return chunks;
}

/** Scrapes a URL with Firecrawl and returns its main content as markdown. */
export async function extractUrlText(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const document = await getFirecrawlClient().scrape(url, {
    formats: ["markdown"],
    timeout: URL_FETCH_TIMEOUT_MS,
    onlyMainContent: true,
  });

  if (!document.markdown) {
    throw new Error(`Firecrawl returned no content for ${url}`);
  }

  return document.markdown.trim();
}

/**
 * Downloads an uploaded file from the private `sources` Storage bucket and
 * parses it with Firecrawl's `/v2/parse` (file-upload) endpoint, which
 * converts PDF/Word/Excel/PowerPoint/CSV/EPUB into clean markdown the same
 * way `.scrape()` does for URLs. Storage — not the request body — is the
 * source of the bytes, since the file was already uploaded client-side to
 * the org's own folder before this source row was created.
 */
export async function extractFileText(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<string> {
  const { data: blob, error } = await supabase.storage.from("sources").download(storagePath);
  if (error || !blob) {
    throw new Error(`Failed to download ${storagePath} from storage: ${error?.message}`);
  }

  const filename = storagePath.split("/").pop() ?? storagePath;
  const document = await getFirecrawlClient().parse(
    { data: blob, filename, contentType: blob.type || undefined },
    { formats: ["markdown"] },
  );

  if (!document.markdown) {
    throw new Error(`Firecrawl returned no content for ${storagePath}`);
  }

  return document.markdown.trim();
}

/** Batches embedding calls — never one request per chunk. */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const { embeddings: batchEmbeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: batch,
    });
    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

/**
 * Runs the full extract -> chunk -> embed -> store pipeline for one source
 * (URL or uploaded file), flipping its status as it goes. Never leaves a
 * source `ready` on partial success, and never touches prior chunks until
 * the new run fully succeeds (so a failed retrain doesn't blank out a
 * working agent).
 */
export async function runIngestion(supabase: SupabaseClient<Database>, sourceId: string) {
  const { data: source, error: fetchError } = await supabase
    .from("sources")
    .select("id, org_id, type, raw_content, storage_path")
    .eq("id", sourceId)
    .single();

  if (fetchError || !source) {
    throw new Error(`Source ${sourceId} not found: ${fetchError?.message}`);
  }
  if (source.type === "url" && !source.raw_content) {
    throw new Error(`Source ${sourceId} has no URL`);
  }
  if (source.type === "file" && !source.storage_path) {
    throw new Error(`Source ${sourceId} has no uploaded file`);
  }

  // Claims the source for this run: only flips to "processing" if it
  // isn't already there. Without this, two overlapping runs (a
  // double-clicked Retrain, a retried trigger) would each snapshot the
  // same "previous chunks" and only delete that snapshot, leaving both
  // runs' new chunk sets coexisting - duplicated context at retrieval
  // time. A row that stays stuck in "processing" (e.g. a crashed run)
  // needs a manual retrain to clear; that's an accepted tradeoff for
  // keeping this a status flag instead of a leased/versioned column.
  const { data: claimed } = await supabase
    .from("sources")
    .update({ status: "processing" })
    .eq("id", sourceId)
    .neq("status", "processing")
    .select("id");

  if (!claimed || claimed.length === 0) {
    throw new Error(`Source ${sourceId} is already being processed`);
  }

  try {
    const text =
      source.type === "file"
        ? await extractFileText(supabase, source.storage_path!)
        : await extractUrlText(source.raw_content!);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("No content to embed after chunking");
    }

    const embeddings = await embedChunks(chunks);

    // Capture the chunks this source had *before* this run so a failed
    // retrain leaves them in place - they're only deleted once the new
    // set has been inserted successfully.
    const { data: previousChunks } = await supabase
      .from("chunks")
      .select("id")
      .eq("source_id", source.id);

    const newChunkRows = chunks.map((content, i) => ({
      org_id: source.org_id,
      source_id: source.id,
      content,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertError } = await supabase.from("chunks").insert(newChunkRows);
    if (insertError) throw new Error(`Failed to store chunks: ${insertError.message}`);

    const previousChunkIds = previousChunks?.map((chunk) => chunk.id) ?? [];
    if (previousChunkIds.length > 0) {
      await supabase.from("chunks").delete().in("id", previousChunkIds);
    }

    await supabase
      .from("sources")
      .update({ status: "ready", error_message: null })
      .eq("id", sourceId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ingestion error";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", sourceId);
    throw err;
  }
}
