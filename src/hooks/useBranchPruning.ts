import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { usePruneStore } from "../store/pruneStore";
import { streamProvider } from "../api/providers";

export function useBranchPruning() {
  const pruneCanvas = useCallback(async (goal: string) => {
    const { nodes, edges, updateNode, getConversationPath } = useCanvasStore.getState();
    const model = useUIStore.getState().model;

    usePruneStore.getState().setIsPruning(true);

    const sourcesSet = new Set(edges.map((e) => e.source));
    const leafNodes = nodes.filter((n) =>
      !sourcesSet.has(n.id) &&
      n.data.nodeType !== "suggestion" &&
      n.data.nodeType !== "distillation"
    );

    if (leafNodes.length === 0) {
      usePruneStore.getState().setIsPruning(false);
      return;
    }

    const leafSummaries = leafNodes.map((leaf) => {
      const path = getConversationPath(leaf.id);
      const lastTwo = path.slice(-2).map((m) => m.content).join(" ").slice(0, 300);
      return `ID:${leaf.id} SUMMARY:${lastTwo}`;
    }).join("\n");

    const prompt = [
      {
        role: "system" as const,
        content: "You are a relevance scorer. For each branch given, output a JSON object mapping the ID to a score 0-100 based on relevance to the user's goal. Output ONLY valid JSON. No explanation.",
      },
      {
        role: "user" as const,
        content: `Goal: "${goal}"\n\nBranches to score:\n${leafSummaries}\n\nRespond with JSON like: {"id1": 85, "id2": 23}`,
      },
    ];

    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 15000);
      let raw = "";
      for await (const chunk of streamProvider(prompt, 0.1, ctrl.signal, model)) {
        raw += chunk;
      }
      const clean = raw.replace(/```json|```/g, "").trim();
      if (!clean) return;
      const scores: Record<string, number> = JSON.parse(clean);

      for (const [nodeId, score] of Object.entries(scores)) {
        if (typeof score === "number") {
          updateNode(nodeId, {
            pruneScore: score,
            pruned: score < 40,
          });
        }
      }
    } catch {
      // silent fail
    }

    usePruneStore.getState().setIsPruning(false);
  }, []);

  const clearPrune = useCallback(() => {
    const { nodes, updateNode } = useCanvasStore.getState();
    for (const node of nodes) {
      if (node.data.pruned || node.data.pruneScore !== undefined) {
        updateNode(node.id, { pruned: false, pruneScore: undefined });
      }
    }
    usePruneStore.getState().clearPrune();
  }, []);

  return { pruneCanvas, clearPrune };
}
