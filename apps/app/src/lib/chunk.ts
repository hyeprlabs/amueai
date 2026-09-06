import "server-only";

const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;

/**
 * Splits markdown into chunks on paragraph boundaries, hard-wrapping any
 * paragraph longer than ~1000 tokens (~4000 chars) with ~100-token
 * (~400-char) overlap. Deliberately simple for MVP. The single chunking
 * path for every source type - text, qa, file, and url all normalize to
 * markdown before reaching this.
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

/** Splits an array into groups of at most `size` items, in order. */
export function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
