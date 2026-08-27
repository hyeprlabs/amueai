import "server-only";

import { lookup as dnsLookup } from "node:dns/promises";
import { isIPv4, isIPv6 } from "node:net";
import { embedMany } from "ai";
import * as cheerio from "cheerio";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/supabase";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;
const EMBED_BATCH_SIZE = 100;
const URL_FETCH_TIMEOUT_MS = 15_000;
const URL_MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10MB
const URL_MAX_REDIRECTS = 5;

type Source = Tables<"sources">;

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

/** Extracts the raw text to chunk for a source, branching on its type. */
export async function extractText(
  supabase: SupabaseClient<Database>,
  source: Pick<Source, "type" | "raw_content" | "storage_path">,
): Promise<string> {
  switch (source.type) {
    case "text":
      if (!source.raw_content) throw new Error("Text source has no content");
      return source.raw_content;
    case "qa":
      if (!source.raw_content) throw new Error("Q&A source has no content");
      return source.raw_content;
    case "file":
      if (!source.storage_path) throw new Error("File source has no storage path");
      return extractFileText(supabase, source.storage_path);
    case "url":
      if (!source.raw_content) throw new Error("URL source has no URL");
      return extractUrlText(source.raw_content);
    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }
}

async function extractFileText(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<string> {
  const { data: blob, error } = await supabase.storage.from("sources").download(storagePath);
  if (error || !blob) throw new Error(`Failed to download file: ${error?.message}`);

  const buffer = Buffer.from(await blob.arrayBuffer());
  const extension = storagePath.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (extension === "txt") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file extension: ${extension}`);
}

/**
 * Blocks loopback, link-local, private (RFC1918/ULA), and unspecified
 * addresses - including the cloud metadata endpoint (169.254.169.254) -
 * so a URL source can't be used as an SSRF vector against internal
 * services. Checked against the *resolved* IP, not just the hostname
 * string, since "http://localhost" and "http://2130706433" (decimal
 * 127.0.0.1) both need to be caught too.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  if (isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 127 || // loopback
      a === 10 || // RFC1918
      a === 0 || // "this" network
      (a === 169 && b === 254) || // link-local + cloud metadata
      (a === 172 && b >= 16 && b <= 31) || // RFC1918
      (a === 192 && b === 168) || // RFC1918
      (a === 100 && b >= 64 && b <= 127) // carrier-grade NAT
    );
  }

  if (isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fe80:") || // link-local
      normalized.startsWith("fc") || // unique local
      normalized.startsWith("fd") || // unique local
      normalized.startsWith("::ffff:127.") || // IPv4-mapped loopback
      normalized.startsWith("::ffff:169.254.")
    );
  }

  return true; // couldn't classify it - fail closed
}

async function assertPublicUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const { address } = await dnsLookup(parsed.hostname);
  if (isPrivateOrReservedIp(address)) {
    throw new Error(`Refusing to fetch a private/internal address: ${parsed.hostname}`);
  }
}

async function extractUrlText(url: string): Promise<string> {
  let currentUrl = url;

  for (let redirectCount = 0; ; redirectCount++) {
    await assertPublicUrl(currentUrl);

    const res = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(URL_FETCH_TIMEOUT_MS),
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (redirectCount >= URL_MAX_REDIRECTS) {
        throw new Error(`Too many redirects fetching ${url}`);
      }
      // Re-validated against the redirect target on the next loop
      // iteration - a malicious server can't 302 its way into an
      // internal address after passing the initial check.
      currentUrl = new URL(res.headers.get("location")!, currentUrl).toString();
      continue;
    }

    if (!res.ok) throw new Error(`Failed to fetch ${currentUrl}: ${res.status}`);

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > URL_MAX_RESPONSE_BYTES) {
      throw new Error(`Response too large: ${contentLength} bytes`);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > URL_MAX_RESPONSE_BYTES) {
      throw new Error(`Response too large: ${buffer.byteLength} bytes`);
    }

    const html = new TextDecoder("utf-8").decode(buffer);
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header").remove();

    return $("body").text().replace(/\s+/g, " ").trim();
  }
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
 * Runs the full extract -> chunk -> embed -> store pipeline for one
 * source, flipping its status as it goes. Never leaves a source `ready`
 * on partial success, and never touches prior chunks until the new run
 * fully succeeds (so a failed retrain doesn't blank out a working bot).
 *
 * Takes whatever Supabase client the caller is authorized with: the
 * Clerk-token client for Phase 1-3's inline route, the service-role
 * client for the Trigger.dev task (Phase 10).
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

  await supabase.from("sources").update({ status: "processing" }).eq("id", sourceId);

  try {
    const text = await extractText(supabase, source);
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
