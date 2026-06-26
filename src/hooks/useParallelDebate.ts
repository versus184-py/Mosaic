import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { streamProvider } from "../api/providers";
import { generateId } from "../utils/layout";
import { MODEL_MAP } from "../api/config";
import type { Message } from "../types/canvas";

// When multi-provider support is added, streamProvider will route by model.
// For now, all models use Mistral.

export function useParallelDebate() {
  const debateFrom = useCallback(async (text: string, parentNodeId: string) => {
    const parentNode = useCanvasStore.getState().getNodeById(parentNodeId);
    if (!parentNode) return;

    const debateModels = useUIStore.getState().debateModels;
    if (!debateModels.length) return;

    const parentPos = parentNode.position;

    const userNodeId = generateId();
    useCanvasStore.getState().addNode({
      id: userNodeId,
      type: "messageNode",
      position: { x: parentPos.x, y: parentPos.y + 200 },
      data: {
        id: userNodeId,
        label: text,
        messages: [{ id: generateId(), role: "user" as const, content: text, timestamp: Date.now() }],
        isActive: false,
        isTyping: false,
        nodeType: "branch",
      },
    });
    useCanvasStore.getState().addEdge({
      id: `e-${parentNodeId}-${userNodeId}`,
      source: parentNodeId,
      target: userNodeId,
      type: "liquidEdge",
    });

    const getConversationPath = useCanvasStore.getState().getConversationPath;
    const conversation = getConversationPath(userNodeId);
    const { systemPrompt, temperature } = useUIStore.getState();
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversation,
    ];

    const aiNodeIds: string[] = [];
    debateModels.forEach((model, i) => {
      const totalModels = debateModels.length;
      const spreadAngle = Math.PI * 0.6;
      const baseAngle = Math.PI / 2;
      const angle = totalModels === 1
        ? baseAngle
        : baseAngle - spreadAngle / 2 + (spreadAngle / (totalModels - 1)) * i;
      const dist = 340;
      const pos = {
        x: parentPos.x + Math.cos(angle) * dist,
        y: parentPos.y + 200 + Math.sin(angle) * dist,
      };

      const aiNodeId = generateId();
      aiNodeIds.push(aiNodeId);
      const modelLabel = MODEL_MAP[model]?.label || model;

      useCanvasStore.getState().addNode({
        id: aiNodeId,
        type: "messageNode",
        position: pos,
        data: {
          id: aiNodeId,
          label: "",
          messages: [{ id: generateId(), role: "assistant" as const, content: "", timestamp: Date.now() }],
          isActive: false,
          isTyping: true,
          nodeType: "response",
          modelLabel,
          debateModel: model,
        },
      });
      useCanvasStore.getState().addEdge({
        id: `e-${userNodeId}-${aiNodeId}`,
        source: userNodeId,
        target: aiNodeId,
        type: "liquidEdge",
      });
    });

    await Promise.allSettled(
      debateModels.map(async (model, i) => {
        const aiNodeId = aiNodeIds[i];
        const ctrl = new AbortController();
        const msgId = generateId();
        let full = "";

        try {
          for await (const chunk of streamProvider(messages as { role: string; content: string }[], temperature, ctrl.signal, model)) {
            full += chunk;
            const node = useCanvasStore.getState().getNodeById(aiNodeId);
            const existing = node?.data?.messages ?? [];
            const idx = existing.findIndex((m: { id: string }) => m.id === msgId);
            const next = idx >= 0
              ? existing.map((m: Message, ix: number) => (ix === idx ? { ...m, content: full } : m))
              : [...existing, { id: msgId, role: "assistant" as const, content: full, timestamp: Date.now() }];
            useCanvasStore.getState().updateNode(aiNodeId, { label: full, messages: next });
          }
          useCanvasStore.getState().updateNode(aiNodeId, { isTyping: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          useCanvasStore.getState().updateNode(aiNodeId, { label: `⚠ Error — ${msg.slice(0, 100)}`, isTyping: false });
        }
      })
    );
  }, []);

  return { debateFrom };
}
