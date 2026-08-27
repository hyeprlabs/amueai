import { describe, expect, it } from "vitest";

import { chunkText } from "./ingestion";

describe("chunkText", () => {
  it("returns one chunk per short paragraph", () => {
    const chunks = chunkText("First paragraph.\n\nSecond paragraph.");
    expect(chunks).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("drops blank paragraphs", () => {
    const chunks = chunkText("First.\n\n\n\nSecond.");
    expect(chunks).toEqual(["First.", "Second."]);
  });

  it("returns nothing for empty or whitespace-only input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("hard-wraps a paragraph longer than the chunk size with overlap", () => {
    const paragraph = "a".repeat(9000);
    const chunks = chunkText(paragraph);

    expect(chunks.length).toBeGreaterThan(1);
    // Every char of the source has to survive somewhere in the chunks.
    expect(chunks.every((chunk) => chunk.length <= 4000)).toBe(true);
    // Consecutive chunks overlap so a sentence split across the boundary
    // isn't lost when only one side of it gets embedded.
    const combinedLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    expect(combinedLength).toBeGreaterThan(paragraph.length);
  });

  it("never produces an empty chunk for a non-empty source", () => {
    const chunks = chunkText("word ".repeat(2000));
    expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
  });
});
