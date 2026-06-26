import { useRef, useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { useRagStore } from "../store/ragStore";
import { useAnalyticsStore } from "../store/analyticsStore";
import { useCanvasManagerStore } from "../store/canvasManagerStore";
import { useToastStore } from "../store/toastStore";
import { streamProvider, embedTexts } from "../api/providers";
import { generateId } from "../utils/layout";
import type { Message } from "../types/canvas";
import { useConfidenceScore } from "./useConfidenceScore";
import { useSuggestionTendrils } from "./useSuggestionTendrils";

export function useStreamMessage(): {
  classifyAndStream: (text: string, nodeId: string, model: string) => Promise<void>;
  stopStreaming: () => void;
} {
  const abortRef = useRef<AbortController | null>(null);
  const { scoreNode } = useConfidenceScore();
  const { spawnTendrils } = useSuggestionTendrils();
  const scoreNodeRef = useRef(scoreNode);
  const spawnRef = useRef(spawnTendrils);
  scoreNodeRef.current = scoreNode;
  spawnRef.current = spawnTendrils;

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const classifyAndStream = useCallback(
    async (text: string, nodeId: string, model: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const { systemPrompt, temperature } = useUIStore.getState();
        const updateNode = useCanvasStore.getState().updateNode;
        const getConversationPath = useCanvasStore.getState().getConversationPath;

        const conversation = getConversationPath(nodeId);

        let ragContext = "";
        const { enabled, searchChunks } = useRagStore.getState();
        if (enabled) {
          const queryEmbeddings = await embedTexts([text]);
          const queryEmbedding = queryEmbeddings?.[0];
          const results = searchChunks(text, 3, queryEmbedding);
          if (results.length > 0) {
            ragContext = "\n\nRelevant context from uploaded documents:\n" +
              results.map((r) => `[${r.docName}] ${r.text}`).join("\n\n");
          }
        }

        const systemContent = systemPrompt + ragContext;

        const messages = [
          { role: "system" as const, content: systemContent },
          ...conversation,
        ];

        const stream = streamProvider(
          messages as { role: string; content: string }[],
          temperature, ctrl.signal, model
        );

        const msgId = generateId();
        let full = "";
        for await (const chunk of stream) {
          full += chunk;
          const node = useCanvasStore.getState().getNodeById(nodeId);
          const existing = node?.data?.messages ?? [];
          const idx = existing.findIndex((m: { id: string }) => m.id === msgId);
          const next = idx >= 0
            ? existing.map((m: Message, i: number) => (i === idx ? { ...m, content: full, timestamp: Date.now() } : m))
            : [...existing, { id: msgId, role: "assistant" as const, content: full, timestamp: Date.now() }];
          updateNode(nodeId, { label: full, messages: next });
        }
        updateNode(nodeId, { isTyping: false });

        const ctx = conversation.map((m) => `${m.role}: ${m.content}`).join("\n").slice(0, 2000);
        if (useUIStore.getState().confidenceEnabled) {
          scoreNodeRef.current?.(nodeId, full, ctx);
        }
        spawnRef.current?.(nodeId, full);

        useAnalyticsStore.getState().recordCompletion(
          useCanvasManagerStore.getState().activeCanvasId,
          model,
          full
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          const node = useCanvasStore.getState().getNodeById(nodeId);
          const existing = node?.data?.label;
          useCanvasStore.getState().updateNode(nodeId, {
            ...(existing ? {} : { label: "[Stopped]" }),
            isTyping: false,
          });
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("Stream failed:", err);
          useToastStore.getState().addToast(`Stream failed: ${msg}`, "error", 5000);
          useCanvasStore.getState().updateNode(nodeId, { label: "⚠ Error — click to retry", isTyping: false });
        }
      }
      abortRef.current = null;
    },
    []
  );

  return { classifyAndStream, stopStreaming };
}
