import { create } from "zustand";
import type { ChatNode, ChatEdge } from "../types/canvas";
import { generateId } from "../utils/layout";
import { validateCanvasData } from "../utils/validation";

const MANAGER_KEY = "mosaic-canvases";
const CANVAS_DATA_PREFIX = "mosaic-canvas-data-";

interface CanvasEntry {
  id: string;
  name: string;
  createdAt: number;
}

interface CanvasData {
  nodes: ChatNode[];
  edges: ChatEdge[];
  viewport: { x: number; y: number; zoom: number };
  positionHistory: { nodes: ChatNode[]; edges: ChatEdge[] }[];
}

interface CanvasManagerState {
  canvases: CanvasEntry[];
  activeCanvasId: string;
  createCanvas: (name?: string) => string;
  deleteCanvas: (id: string) => void;
  renameCanvas: (id: string, name: string) => void;
  switchCanvas: (id: string) => void;
  duplicateCanvas: (id: string) => string;
  saveCanvasData: (id: string, data: CanvasData) => void;
  loadCanvasData: (id: string) => CanvasData | null;
}

function loadCanvases(): CanvasEntry[] {
  try {
    const raw = localStorage.getItem(MANAGER_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCanvases(canvases: CanvasEntry[]) {
  try {
    localStorage.setItem(MANAGER_KEY, JSON.stringify(canvases));
  } catch { /* noop */ }
}

const initialCanvases = loadCanvases();
let initialActive = initialCanvases[0]?.id || "";

if (initialCanvases.length === 0) {
  const id = generateId();
  initialCanvases.push({ id, name: "Canvas 1", createdAt: Date.now() });
  initialActive = id;
  saveCanvases(initialCanvases);
}

export const useCanvasManagerStore = create<CanvasManagerState>((set, get) => ({
  canvases: initialCanvases,
  activeCanvasId: initialActive,

  createCanvas: (name) => {
    const id = generateId();
    const entry: CanvasEntry = {
      id,
      name: name || `Canvas ${get().canvases.length + 1}`,
      createdAt: Date.now(),
    };
    set((s) => ({ canvases: [...s.canvases, entry], activeCanvasId: id }));
    saveCanvases([...get().canvases]);
    return id;
  },

  deleteCanvas: (id) => {
    const { canvases, activeCanvasId } = get();
    if (canvases.length <= 1) return;
    const next = canvases.filter((c) => c.id !== id);
    localStorage.removeItem(CANVAS_DATA_PREFIX + id);
    const newActive = activeCanvasId === id ? next[0].id : activeCanvasId;
    set({ canvases: next, activeCanvasId: newActive });
    saveCanvases(next);
  },

  renameCanvas: (id, name) => {
    set((s) => ({
      canvases: s.canvases.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
    saveCanvases(get().canvases);
  },

  switchCanvas: (id) => {
    set({ activeCanvasId: id });
  },

  duplicateCanvas: (id) => {
    const src = get().canvases.find((c) => c.id === id);
    if (!src) return "";
    const data = get().loadCanvasData(id);
    const newId = generateId();
    const entry: CanvasEntry = {
      id: newId,
      name: src.name + " (copy)",
      createdAt: Date.now(),
    };
    set((s) => ({ canvases: [...s.canvases, entry], activeCanvasId: newId }));
    saveCanvases(get().canvases);
    if (data) {
      get().saveCanvasData(newId, data);
    }
    return newId;
  },

  saveCanvasData: (id, data) => {
    try {
      localStorage.setItem(CANVAS_DATA_PREFIX + id, JSON.stringify(data));
    } catch { /* noop */ }
  },

  loadCanvasData: (id) => {
    try {
      const raw = localStorage.getItem(CANVAS_DATA_PREFIX + id);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const validation = validateCanvasData(parsed);
      if (!validation.valid) {
        console.warn(`Canvas data validation failed for ${id}, resetting:`, validation.errors.join("; "));
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },
}));
