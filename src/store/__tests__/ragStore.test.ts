import { describe, it, expect, beforeEach } from "vitest";
import { useRagStore } from "../ragStore";

function makeDoc(name: string, chunks: { text: string; index: number; embedding?: number[] }[]) {
  return {
    name,
    type: ".txt",
    size: chunks.reduce((s, c) => s + c.text.length, 0),
    chunks,
  };
}

describe("ragStore", () => {
  beforeEach(() => {
    useRagStore.setState({ documents: [], enabled: false });
    localStorage.clear();
  });

  describe("addDocument", () => {
    it("adds a document with auto-generated id and timestamp", () => {
      const id = useRagStore.getState().addDocument(makeDoc("test.txt", [{ text: "hello", index: 0 }]));
      const doc = useRagStore.getState().documents[0];
      expect(doc.id).toBe(id);
      expect(doc.addedAt).toBeGreaterThan(0);
      expect(doc.name).toBe("test.txt");
    });

    it("throws at MAX_DOCUMENTS limit", () => {
      for (let i = 0; i < 50; i++) {
        useRagStore.getState().addDocument(makeDoc(`doc${i}.txt`, [{ text: `chunk${i}`, index: 0 }]));
      }
      expect(() => {
        useRagStore.getState().addDocument(makeDoc("overflow.txt", [{ text: "x", index: 0 }]));
      }).toThrow("Maximum of 50 documents reached");
    });

    it("throws when total size exceeds MAX_TOTAL_SIZE", () => {
      const bigChunk = { text: "x".repeat(2 * 1024 * 1024), index: 0 };
      for (let i = 0; i < 25; i++) {
        useRagStore.getState().addDocument(makeDoc(`big${i}.txt`, [bigChunk]));
      }
      expect(() => {
        useRagStore.getState().addDocument(makeDoc("too-big.txt", [bigChunk]));
      }).toThrow(/exceeded/);
    });

    it("persists to localStorage", () => {
      useRagStore.getState().addDocument(makeDoc("persist.txt", [{ text: "data", index: 0 }]));
      const stored = JSON.parse(localStorage.getItem("mosaic-rag") || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("persist.txt");
    });

    it("accepts chunks with embeddings", () => {
      const id = useRagStore.getState().addDocument(makeDoc("emb.txt", [
        { text: "hello", index: 0, embedding: [0.1, 0.2, 0.3] },
      ]));
      const doc = useRagStore.getState().documents.find((d) => d.id === id);
      expect(doc?.chunks[0].embedding).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe("removeDocument", () => {
    it("removes a document by id", () => {
      const id = useRagStore.getState().addDocument(makeDoc("a.txt", [{ text: "a", index: 0 }]));
      useRagStore.getState().addDocument(makeDoc("b.txt", [{ text: "b", index: 0 }]));
      useRagStore.getState().removeDocument(id);
      expect(useRagStore.getState().documents).toHaveLength(1);
      expect(useRagStore.getState().documents[0].name).toBe("b.txt");
    });
  });

  describe("clearDocuments", () => {
    it("removes all documents and clears localStorage", () => {
      useRagStore.getState().addDocument(makeDoc("a.txt", [{ text: "a", index: 0 }]));
      useRagStore.getState().addDocument(makeDoc("b.txt", [{ text: "b", index: 0 }]));
      useRagStore.getState().clearDocuments();
      expect(useRagStore.getState().documents).toHaveLength(0);
      expect(JSON.parse(localStorage.getItem("mosaic-rag") || "[]")).toHaveLength(0);
    });
  });

  describe("searchChunks — TF-IDF fallback (no embeddings)", () => {
    it("finds relevant chunks by keyword", () => {
      useRagStore.getState().addDocument(makeDoc("doc.txt", [
        { text: "the quick brown fox jumps over the lazy dog", index: 0 },
        { text: "python is a programming language", index: 1 },
      ]));
      const results = useRagStore.getState().searchChunks("fox");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].text).toContain("fox");
    });

    it("returns empty for empty query", () => {
      useRagStore.getState().addDocument(makeDoc("doc.txt", [{ text: "content", index: 0 }]));
      expect(useRagStore.getState().searchChunks("")).toEqual([]);
      expect(useRagStore.getState().searchChunks("  ")).toEqual([]);
    });

    it("returns empty when no documents", () => {
      expect(useRagStore.getState().searchChunks("query")).toEqual([]);
    });

    it("returns up to topK results", () => {
      useRagStore.getState().addDocument(makeDoc("doc.txt", [
        { text: "data science machine learning", index: 0 },
        { text: "machine learning models", index: 1 },
        { text: "deep learning neural networks", index: 2 },
      ]));
      const results = useRagStore.getState().searchChunks("learning", 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("scores results in descending order", () => {
      useRagStore.getState().addDocument(makeDoc("doc.txt", [
        { text: "machine learning is great for data", index: 0 },
        { text: "the weather today is sunny and warm", index: 1 },
      ]));
      const results = useRagStore.getState().searchChunks("machine learning");
      if (results.length >= 2) {
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      }
    });
  });

  describe("searchChunks — vector search (with embeddings)", () => {
    it("uses query embedding when provided", () => {
      useRagStore.getState().addDocument(makeDoc("doc.txt", [
        { text: "cat animal pet", index: 0, embedding: [1, 0, 0] },
        { text: "car vehicle road", index: 1, embedding: [0, 1, 0] },
      ]));
      const results = useRagStore.getState().searchChunks("cat", 3, [1, 0, 0]);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].text).toBe("cat animal pet");
    });

    it("falls back to TF-IDF when query embedding not provided", () => {
      useRagStore.getState().addDocument(makeDoc("doc.txt", [
        { text: "cat animal pet", index: 0, embedding: [1, 0, 0] },
      ]));
      const results = useRagStore.getState().searchChunks("cat");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("setEnabled", () => {
    it("toggles the enabled flag", () => {
      expect(useRagStore.getState().enabled).toBe(false);
      useRagStore.getState().setEnabled(true);
      expect(useRagStore.getState().enabled).toBe(true);
      useRagStore.getState().setEnabled(false);
      expect(useRagStore.getState().enabled).toBe(false);
    });
  });
});
