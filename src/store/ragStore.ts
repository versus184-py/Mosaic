import { create } from "zustand";
import { generateId } from "../utils/layout";
import { validateRagDocs } from "../utils/validation";

const MAX_DOCUMENTS = 50;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

interface Chunk {
  text: string;
  index: number;
}

export interface RagDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: Chunk[];
  addedAt: number;
}

interface RagState {
  documents: RagDocument[];
  enabled: boolean;
  addDocument: (doc: Omit<RagDocument, "id" | "addedAt">) => string;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
  searchChunks: (query: string, topK?: number) => { text: string; docName: string; score: number }[];
  setEnabled: (v: boolean) => void;
}

function tokenize(text: string): Map<string, number> {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return freq;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const [k, v] of a) {
    normA += v * v;
    const bv = b.get(k) || 0;
    dot += v * bv;
  }
  for (const v of b.values()) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const RAG_KEY = "mosaic-rag";

function loadDocs(): RagDocument[] {
  try {
    const raw = localStorage.getItem(RAG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const validation = validateRagDocs(parsed);
    if (!validation.valid) {
      console.warn("RAG documents data validation failed, resetting:", validation.errors.join("; "));
      return [];
    }
    return parsed;
  } catch { return []; }
}

function saveDocs(docs: RagDocument[]) {
  try {
    localStorage.setItem(RAG_KEY, JSON.stringify(docs));
  } catch { /* noop */ }
}

function getTotalSize(docs: RagDocument[]): number {
  return docs.reduce((sum, d) => sum + d.size, 0);
}

export const useRagStore = create<RagState>((set, get) => ({
  documents: loadDocs(),
  enabled: false,

  addDocument: (doc) => {
    const state = get();
    if (state.documents.length >= MAX_DOCUMENTS) {
      throw new Error(`Maximum of ${MAX_DOCUMENTS} documents reached`);
    }
    const totalSize = getTotalSize(state.documents);
    if (totalSize + doc.size > MAX_TOTAL_SIZE) {
      throw new Error(`Total document storage limit of ${MAX_TOTAL_SIZE / 1024 / 1024}MB exceeded`);
    }
    const id = generateId();
    const entry: RagDocument = { ...doc, id, addedAt: Date.now() };
    set((s) => ({ documents: [...s.documents, entry] }));
    saveDocs(get().documents);
    return id;
  },

  removeDocument: (id) => {
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
    saveDocs(get().documents);
  },

  clearDocuments: () => {
    set({ documents: [] });
    saveDocs([]);
  },

  searchChunks: (query, topK = 3) => {
    const docs = get().documents;
    if (!docs.length || !query.trim()) return [];
    const queryVec = tokenize(query);
    const scored: { text: string; docName: string; score: number }[] = [];
    for (const doc of docs) {
      for (const chunk of doc.chunks) {
        const chunkVec = tokenize(chunk.text);
        const score = cosineSimilarity(queryVec, chunkVec);
        if (score > 0.05) {
          scored.push({ text: chunk.text, docName: doc.name, score });
        }
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  },

  setEnabled: (v) => set({ enabled: v }),
}));
