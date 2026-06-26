import { useCallback, useState } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { streamProvider } from "../api/providers";
import { generateId } from "../utils/layout";

export function useDistillation() {
  const [isDistilling, setIsDistilling] = useState(false);

  const distill = useCallback(async () => {
    const { nodes, edges, addNode, addEdge, updateNode } = useCanvasStore.getState();
    const model = useUIStore.getState().model;
    const temperature = useUIStore.getState().temperature;

    if (nodes.length === 0) return;
    setIsDistilling(true);

    const sourcesSet = new Set(edges.map((e) => e.source));
    const leafNodes = nodes.filter((n) => !sourcesSet.has(n.id) && n.data.nodeType !== "suggestion");

    if (leafNodes.length === 0) {
      setIsDistilling(false);
      return;
    }

    const getConversationPath = useCanvasStore.getState().getConversationPath;
    const pathSummaries = leafNodes.map((leaf, i) => {
      const path = getConversationPath(leaf.id);
      const summary = path.map((m) => `${m.role}: ${m.content}`).join("\n");
      return `--- Branch ${i + 1} ---\n${summary}`;
    }).join("\n\n");

    const messages = [
      {
        role: "system" as const,
        content: "You are a synthesis assistant. You will receive multiple conversation branches from an AI canvas. Write a single, coherent, de-duplicated synthesis that captures the key insights and conclusions across all branches. Use clear headings. Be concise.",
      },
      {
        role: "user" as const,
        content: `Synthesize these conversation branches into one clear summary:\n\n${pathSummaries.slice(0, 6000)}`,
      },
    ];

    const maxY = Math.max(...nodes.map((n) => n.position.y));
    const centerX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
    const distillPos = { x: centerX - 210, y: maxY + 320 };

    const distillId = generateId();
    addNode({
      id: distillId,
      type: "messageNode",
      position: distillPos,
      data: {
        id: distillId,
        label: "",
        messages: [{ id: generateId(), role: "assistant" as const, content: "", timestamp: Date.now() }],
        isActive: false,
        isTyping: true,
        nodeType: "distillation",
        width: 420,
      },
    });

    for (const leaf of leafNodes) {
      addEdge({
        id: `e-distill-${leaf.id}-${distillId}`,
        source: leaf.id,
        target: distillId,
        type: "distillEdge",
      });
    }

    try {
      const ctrl = new AbortController();
      const msgId = generateId();
      let full = "";

      for await (const chunk of streamProvider(messages, temperature, ctrl.signal, model)) {
        full += chunk;
        const existing = useCanvasStore.getState().getNodeById(distillId)?.data.messages ?? [];
        const idx = existing.findIndex((m: { id: string }) => m.id === msgId);
        const next = idx >= 0
          ? existing.map((m: any, i: number) => (i === idx ? { ...m, content: full } : m))
          : [...existing, { id: msgId, role: "assistant" as const, content: full, timestamp: Date.now() }];
        updateNode(distillId, { label: full, messages: next });
      }
      updateNode(distillId, { isTyping: false });
    } catch {
      updateNode(distillId, { label: "⚠ Distillation failed", isTyping: false });
    }

    setIsDistilling(false);
  }, []);

  return { distill, isDistilling };
}
