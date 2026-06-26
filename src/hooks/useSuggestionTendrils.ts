import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { streamProvider } from "../api/providers";
import { generateId } from "../utils/layout";

export function useSuggestionTendrils() {
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const [id, t] of timeoutRefs.current) {
        clearTimeout(t);
      }
      timeoutRefs.current.clear();
    };
  }, []);

  const spawnTendrils = useCallback(async (parentNodeId: string, responseText: string) => {
    const model = useUIStore.getState().model;
    const tendrilsEnabled = useUIStore.getState().tendrilsEnabled;
    if (!tendrilsEnabled) return;

    const parentNode = useCanvasStore.getState().getNodeById(parentNodeId);
    if (!parentNode) return;

    const prompt = [
      {
        role: "system" as const,
        content: "Generate exactly 3 short follow-up questions (max 12 words each) the user might want to ask next. Output ONLY a JSON array of 3 strings. No explanation, no markdown.",
      },
      {
        role: "user" as const,
        content: `AI just said: "${responseText.slice(0, 500)}"\n\nGenerate 3 follow-up questions.`,
      },
    ];

    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10000);
      let raw = "";
      for await (const chunk of streamProvider(prompt, 0.8, ctrl.signal, model)) {
        raw += chunk;
      }
      const clean = raw.replace(/```json|```/g, "").trim();
      const questions: string[] = JSON.parse(clean);
      if (!Array.isArray(questions)) return;

      const parentPos = parentNode.position;
      const angles = [-0.5, 0, 0.5];

      questions.slice(0, 3).forEach((q, i) => {
        const angle = Math.PI / 2 + angles[i];
        const dist = 280;
        const pos = {
          x: parentPos.x + Math.cos(angle) * dist,
          y: parentPos.y + Math.sin(angle) * dist,
        };

        const nodeId = generateId();
        addNode({
          id: nodeId,
          type: "messageNode",
          position: pos,
          data: {
            id: nodeId,
            label: q,
            messages: [],
            isActive: false,
            isTyping: false,
            nodeType: "suggestion",
            suggestionText: q,
          },
        });
        addEdge({
          id: `e-tendril-${parentNodeId}-${nodeId}`,
          source: parentNodeId,
          target: nodeId,
          type: "tendrilEdge",
        });

        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          removeNode(nodeId);
          timeoutRefs.current.delete(nodeId);
        }, 30000);
        timeoutRefs.current.set(nodeId, t);
      });
    } catch (err) {
      console.warn("Failed to spawn suggestion tendrils:", err);
    }
  }, [addNode, addEdge, removeNode]);

  const materializeTendril = useCallback((nodeId: string) => {
    const t = timeoutRefs.current.get(nodeId);
    if (t) {
      clearTimeout(t);
      timeoutRefs.current.delete(nodeId);
    }
    useCanvasStore.getState().updateNode(nodeId, { nodeType: "branch" });
  }, []);

  return { spawnTendrils, materializeTendril };
}
