import { create } from "zustand";
import type { ChatNode, ChatEdge, CanvasState } from "../types/canvas";
import { deepClone, layoutTree } from "../utils/layout";
import { useCanvasManagerStore } from "./canvasManagerStore";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(state: CanvasState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const mgr = useCanvasManagerStore.getState();
    mgr.saveCanvasData(mgr.activeCanvasId, {
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      positionHistory: state.positionHistory,
    });
    saveTimer = null;
  }, 300);
}

function pushHistory(state: CanvasState) {
  const history = state.positionHistory || [];
  const entry = { nodes: deepClone(state.nodes), edges: deepClone(state.edges) };
  return [...history.slice(-49), entry];
}

function flushSave(state: CanvasState) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    const mgr = useCanvasManagerStore.getState();
    mgr.saveCanvasData(mgr.activeCanvasId, {
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      positionHistory: state.positionHistory,
    });
  }
}

function loadInitialState(): Partial<CanvasState> & { bookmarkedIds?: Set<string> } {
  const mgr = useCanvasManagerStore.getState();
  const data = mgr.loadCanvasData(mgr.activeCanvasId);
  if (data) {
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      positionHistory: data.positionHistory || [],
      bookmarkedIds: new Set((data.nodes || []).filter((n: ChatNode) => n.data.bookmarked).map((n: ChatNode) => n.id)),
    };
  }
  return {};
}

const initial = loadInitialState();

interface CanvasActions {
  setNodes: (nodes: ChatNode[]) => void;
  setEdges: (edges: ChatEdge[]) => void;
  addNode: (node: ChatNode) => void;
  addEdge: (edge: ChatEdge) => void;
  updateNode: (id: string, data: Partial<ChatNode["data"]>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  removeCascade: (id: string) => void;
  setActiveNode: (id: string | null) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  clearCanvas: () => void;
  undo: () => void;
  importData: (data: { nodes: ChatNode[]; edges: ChatEdge[]; viewport?: { x: number; y: number; zoom: number } }) => void;

  autoLayout: () => void;
  toggleCollapse: (id: string) => void;
  toggleBookmark: (id: string) => void;
  getNodeById: (id: string) => ChatNode | undefined;
  getChildCount: (parentId: string) => number;
  getDescendantIds: (id: string) => string[];
  canUndo: () => boolean;
  getConversationPath: (id: string) => { role: string; content: string }[];
  loadCanvas: (canvasId: string) => void;
  flushSave: () => void;
  nodes: ChatNode[];
  edges: ChatEdge[];
  activeNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  positionHistory: { nodes: ChatNode[]; edges: ChatEdge[] }[];
  bookmarkedIds: Set<string>;
}

type CanvasStore = CanvasActions;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: initial.nodes || [],
  edges: initial.edges || [],
  activeNodeId: null,
  viewport: initial.viewport || { x: 0, y: 0, zoom: 1 },
  positionHistory: initial.positionHistory || [],
  bookmarkedIds: new Set(),

  loadCanvas: (canvasId) => {
    flushSave(get());
    const mgr = useCanvasManagerStore.getState();
    const data = mgr.loadCanvasData(canvasId);
    if (data) {
      const bookmarkedIds = new Set((data.nodes || []).filter((n: ChatNode) => n.data.bookmarked).map((n: ChatNode) => n.id));
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
        positionHistory: data.positionHistory || [],
        activeNodeId: null,
        bookmarkedIds,
      });
    } else {
      set({ nodes: [], edges: [], activeNodeId: null, viewport: { x: 0, y: 0, zoom: 1 }, positionHistory: [], bookmarkedIds: new Set() });
    }
  },

  flushSave: () => flushSave(get()),

  setNodes: (nodes) => {
    set({ nodes });
    scheduleSave(get());
  },

  setEdges: (edges) => {
    set({ edges });
    scheduleSave(get());
  },

  addNode: (node) => {
    set((s) => {
      const history = pushHistory(s);
      return { nodes: [...s.nodes, node], positionHistory: history };
    });
    scheduleSave(get());
  },

  addEdge: (edge) => {
    set((s) => ({ edges: [...s.edges, edge] }));
    scheduleSave(get());
  },

  updateNode: (id, data) => {
    set((s) => {
      const next = { ...s };
      if ("bookmarked" in data) {
        const ids = new Set(s.bookmarkedIds);
        if (data.bookmarked) ids.add(id); else ids.delete(id);
        next.bookmarkedIds = ids;
      }
      next.nodes = s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      );
      return next;
    });
    scheduleSave(get());
  },

  updateNodePosition: (id, position) => {
    const state = get();
    const original = state.nodes.find((n) => n.id === id);
    if (original && (original.position.x !== position.x || original.position.y !== position.y)) {
      const history = state.positionHistory || [];
      const entry = { nodes: deepClone(state.nodes), edges: deepClone(state.edges) };
      set((s) => ({
        positionHistory: [...history.slice(-49), entry],
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, position } : n
        ),
      }));
    } else {
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, position } : n
        ),
      }));
    }
    scheduleSave(get());
  },

  removeNode: (id) => {
    set((s) => {
      const history = pushHistory(s);
      return {
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        positionHistory: history,
      };
    });
    scheduleSave(get());
  },

  removeCascade: (id) => {
    const state = get();
    const descendantIds = state.getDescendantIds(id);
    const allToRemove = new Set([id, ...descendantIds]);
    set((s) => {
      const history = pushHistory(s);
      return {
        nodes: s.nodes.filter((n) => !allToRemove.has(n.id)),
        edges: s.edges.filter(
          (e) => !allToRemove.has(e.source) && !allToRemove.has(e.target)
        ),
        activeNodeId: s.activeNodeId && allToRemove.has(s.activeNodeId) ? null : s.activeNodeId,
        positionHistory: history,
      };
    });
    scheduleSave(get());
  },

  setActiveNode: (id) => set({ activeNodeId: id }),

  setViewport: (viewport) => {
    set({ viewport });
    scheduleSave(get());
  },

  clearCanvas: () => {
    set((s) => {
      const history = s.nodes.length > 0 ? pushHistory(s) : [];
      return { nodes: [], edges: [], activeNodeId: null, positionHistory: history, bookmarkedIds: new Set() };
    });
    scheduleSave(get());
  },

  undo: () => {
    const state = get();
    const history = state.positionHistory;
    if (!history || history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      positionHistory: history.slice(0, -1),
    });
    scheduleSave(get());
  },

  importData: (data) => {
    set({
      nodes: data.nodes,
      edges: data.edges,
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      activeNodeId: null,
      positionHistory: [],
    });
    scheduleSave(get());
  },

  autoLayout: () => {
    const state = get();
    const positions = layoutTree(state.nodes, state.edges);
    if (positions.size === 0) return;
    const history = state.positionHistory || [];
    const entry = { nodes: deepClone(state.nodes), edges: deepClone(state.edges) };
    set({
      nodes: state.nodes.map((n) => {
        const pos = positions.get(n.id);
        return pos ? { ...n, position: pos } : n;
      }),
      positionHistory: [...history.slice(-49), entry],
    });
    scheduleSave(get());
  },

  toggleCollapse: (id) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n
      ),
    }));
    scheduleSave(get());
  },

  toggleBookmark: (id) => {
    set((s) => {
      const next = new Set(s.bookmarkedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return {
        bookmarkedIds: next,
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, bookmarked: !n.data.bookmarked } } : n
        ),
      };
    });
    scheduleSave(get());
  },

  getNodeById: (id) => get().nodes.find((n) => n.id === id),

  getChildCount: (parentId) =>
    get().edges.filter((e) => e.source === parentId).length,

  getDescendantIds: (id) => {
    const edges = get().edges;
    const directChildren = edges.filter((e) => e.source === id).map((e) => e.target);
    const all: string[] = [];
    const walk = (ids: string[]) => {
      for (const childId of ids) {
        all.push(childId);
        const grandchildren = edges.filter((e) => e.source === childId).map((e) => e.target);
        if (grandchildren.length > 0) walk(grandchildren);
      }
    };
    walk(directChildren);
    return all;
  },

  canUndo: () => get().positionHistory.length > 0,

  getConversationPath: (id) => {
    const { nodes, edges } = get();
    const path: { role: string; content: string }[] = [];

    function walkUp(nodeId: string) {
      const parentEdges = edges.filter((e) => e.target === nodeId);
      if (parentEdges.length > 0) {
        walkUp(parentEdges[0].source);
      }
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        for (const msg of node.data.messages) {
          if (msg.content) {
            path.push({ role: msg.role, content: msg.content });
          }
        }
      }
    }

    walkUp(id);
    return path;
  },
}));
