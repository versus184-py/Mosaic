import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { streamProvider } from "../api/providers";

export function useConfidenceScore() {
  const updateNode = useCanvasStore((s) => s.updateNode);

  const scoreNode = useCallback(async (nodeId: string, responseText: string, conversationContext: string) => {
    const model = useUIStore.getState().model;
    const prompt = [
      {
        role: "system" as const,
        content: "You are a calibration assistant. Respond with ONLY a single integer between 0 and 100. No explanation.",
      },
      {
        role: "user" as const,
        content: `Given this conversation context:\n${conversationContext.slice(0, 1500)}\n\nAnd this AI response:\n${responseText.slice(0, 1000)}\n\nRate the confidence/reliability of this response from 0 (completely uncertain/speculative) to 100 (highly confident/well-supported). Reply with only the number.`,
      },
    ];

    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 8000);
      let raw = "";
      for await (const chunk of streamProvider(prompt, 0.1, ctrl.signal, model)) {
        raw += chunk;
        if (raw.length > 10) break;
      }
      const score = parseInt(raw.trim(), 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        updateNode(nodeId, { confidence: score });
      }
    } catch {
      // silent fail
    }
  }, [updateNode]);

  return { scoreNode };
}
