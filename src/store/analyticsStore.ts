import { create } from "zustand";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "mistral-large-latest": { input: 2 / 1_000_000, output: 6 / 1_000_000 },
  "mistral-small-latest": { input: 0.2 / 1_000_000, output: 0.6 / 1_000_000 },
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface CompletionRecord {
  model: string;
  tokens: number;
  timestamp: number;
}

interface CanvasStats {
  totalTokens: number;
  totalCost: number;
  modelBreakdown: Record<string, { tokens: number; cost: number; count: number }>;
  completions: CompletionRecord[];
}

interface AnalyticsState {
  stats: Record<string, CanvasStats>;
  recordCompletion: (canvasId: string, model: string, text: string) => void;
  getCanvasStats: (canvasId: string) => CanvasStats;
  resetCanvasStats: (canvasId: string) => void;
  computeNodeStats: (nodes: { id: string; data: { nodeType: string; messages: any[] } }[], edges: { source: string; target: string }[]) => {
    totalNodes: number;
    branchNodes: number;
    responseNodes: number;
    rootNodes: number;
    totalMessages: number;
    depth: number;
    branchCount: number;
  };
}

const ANALYTICS_KEY = "mosaic-analytics";

function loadStats(): Record<string, CanvasStats> {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      console.warn("Analytics data invalid, resetting");
      return {};
    }
    return parsed;
  } catch { return {}; }
}

function saveStats(stats: Record<string, CanvasStats>) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(stats));
  } catch { /* noop */ }
}

function emptyStats(): CanvasStats {
  return { totalTokens: 0, totalCost: 0, modelBreakdown: {}, completions: [] };
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  stats: loadStats(),

  recordCompletion: (canvasId, model, text) => {
    const tokens = estimateTokens(text);
    const pricing = MODEL_PRICING[model] || { input: 1 / 1_000_000, output: 3 / 1_000_000 };
    const cost = tokens * pricing.output;

    set((s) => {
      const canvasStats = s.stats[canvasId] || emptyStats();
      const modelStats = canvasStats.modelBreakdown[model] || { tokens: 0, cost: 0, count: 0 };

      const updated: CanvasStats = {
        totalTokens: canvasStats.totalTokens + tokens,
        totalCost: canvasStats.totalCost + cost,
        modelBreakdown: {
          ...canvasStats.modelBreakdown,
          [model]: {
            tokens: modelStats.tokens + tokens,
            cost: modelStats.cost + cost,
            count: modelStats.count + 1,
          },
        },
        completions: [
          ...canvasStats.completions.slice(-99),
          { model, tokens, timestamp: Date.now() },
        ],
      };

      return { stats: { ...s.stats, [canvasId]: updated } };
    });

    saveStats(get().stats);
  },

  getCanvasStats: (canvasId) => {
    return get().stats[canvasId] || emptyStats();
  },

  resetCanvasStats: (canvasId) => {
    set((s) => {
      const next = { ...s.stats };
      delete next[canvasId];
      return { stats: next };
    });
    saveStats(get().stats);
  },

  computeNodeStats: (nodes, edges) => {
    const childMap = new Map<string, string[]>();
    for (const edge of edges) {
      if (!childMap.has(edge.source)) childMap.set(edge.source, []);
      childMap.get(edge.source)!.push(edge.target);
    }

    const targets = new Set(edges.map((e) => e.target));
    const roots = nodes.filter((n) => !targets.has(n.id));

    let maxDepth = 0;
    function walkDepth(nodeId: string, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      const children = childMap.get(nodeId) || [];
      for (const c of children) walkDepth(c, depth + 1);
    }
    for (const root of roots) walkDepth(root.id, 1);

    const branchSources = new Set<string>();
    for (const e of edges) {
      const siblingCount = edges.filter((x) => x.source === e.source).length;
      if (siblingCount > 1) branchSources.add(e.source);
    }
    const branchCount = branchSources.size;

    return {
      totalNodes: nodes.length,
      branchNodes: nodes.filter((n) => n.data.nodeType === "branch").length,
      responseNodes: nodes.filter((n) => n.data.nodeType === "response").length,
      rootNodes: roots.length,
      totalMessages: nodes.reduce((sum, n) => sum + n.data.messages.length, 0),
      depth: maxDepth,
      branchCount,
    };
  },
}));
