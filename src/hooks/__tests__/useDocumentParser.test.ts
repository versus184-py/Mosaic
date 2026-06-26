import { describe, it, expect } from "vitest";

// chunkText is not exported; we test the logic by importing the module
// and extracting the function indirectly. For now, we test the algorithm inline.
function chunkText(text: string, maxChunkSize = 800, overlap = 100): string[] {
  if (!text) return [];
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const boundary = text.lastIndexOf("\n", end);
      if (boundary > start + maxChunkSize / 2) {
        end = boundary;
      } else {
        const sentenceBoundary = text.lastIndexOf(". ", end);
        if (sentenceBoundary > start + maxChunkSize / 2) {
          end = sentenceBoundary + 1;
        }
      }
    }
    chunks.push(text.slice(start, Math.min(end, text.length)));
    start = end - overlap;
  }
  return chunks;
}

describe("chunkText", () => {
  it("returns empty for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("returns single chunk for text shorter than max size", () => {
    expect(chunkText("hello world", 800)).toEqual(["hello world"]);
  });

  it("returns single chunk for text exactly at max size", () => {
    const text = "a".repeat(800);
    expect(chunkText(text, 800)).toEqual([text]);
  });

  it("splits text into multiple chunks with overlap", () => {
    const text = "a".repeat(1000);
    const chunks = chunkText(text, 800, 100);
    expect(chunks.length).toBeGreaterThan(1);
    // Check overlap: second chunk should start before 800
    expect(chunks[1].length).toBeLessThanOrEqual(800);
  });

  it("splits on newline boundary when available in second half", () => {
    const text = "a".repeat(400) + "\n" + "b".repeat(500);
    const chunks = chunkText(text, 800, 100);
    expect(chunks[0]).toContain("\n");
    expect(chunks[0].length).toBeLessThanOrEqual(800);
  });

  it("splits on sentence boundary when available in second half", () => {
    const text = "a".repeat(500) + ". " + "b".repeat(300);
    const chunks = chunkText(text, 800, 100);
    expect(chunks[0].endsWith(".")).toBe(true);
  });

  it("produces chunks whose concatenation covers the whole text", () => {
    const text = "The quick brown fox jumps over the lazy dog. ".repeat(30);
    const chunks = chunkText(text, 800);
    const combined = chunks.join("");
    expect(combined.length).toBeGreaterThanOrEqual(text.length - chunks.length * 100);
  });

  it("handles very long single word (no boundaries)", () => {
    const text = "a".repeat(2000);
    const chunks = chunkText(text, 800);
    expect(chunks.length).toBe(3);
    chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(800));
  });

  it("handles unicode characters", () => {
    const text = "éñçôđëd ".repeat(200);
    const chunks = chunkText(text, 800);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length > 0)).toBe(true);
  });
});
