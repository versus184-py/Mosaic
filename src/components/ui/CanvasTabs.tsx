import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasManagerStore } from "../../store/canvasManagerStore";
import { useCanvasStore } from "../../store/canvasStore";

export function CanvasTabs() {
  const canvases = useCanvasManagerStore((s) => s.canvases);
  const activeCanvasId = useCanvasManagerStore((s) => s.activeCanvasId);
  const switchCanvas = useCanvasManagerStore((s) => s.switchCanvas);
  const deleteCanvas = useCanvasManagerStore((s) => s.deleteCanvas);
  const renameCanvas = useCanvasManagerStore((s) => s.renameCanvas);
  const createCanvas = useCanvasManagerStore((s) => s.createCanvas);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSwitch = useCallback((id: string) => {
    const state = useCanvasStore.getState();
    const mgr = useCanvasManagerStore.getState();
    if (mgr.activeCanvasId !== id) {
      useCanvasStore.getState().flushSave();
      switchCanvas(id);
      loadCanvas(id);
    }
  }, [switchCanvas, loadCanvas]);

  const handleAdd = useCallback(() => {
    const state = useCanvasStore.getState();
    const mgr = useCanvasManagerStore.getState();
    mgr.saveCanvasData(mgr.activeCanvasId, {
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      positionHistory: state.positionHistory,
    });
    const id = createCanvas();
    loadCanvas(id);
  }, [createCanvas, loadCanvas]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const mgr = useCanvasManagerStore.getState();
    if (mgr.canvases.length <= 1) return;
    if (id === mgr.activeCanvasId) {
      const remaining = mgr.canvases.filter((c) => c.id !== id);
      const nextId = remaining[0].id;
      mgr.deleteCanvas(id);
      loadCanvas(nextId);
    } else {
      mgr.deleteCanvas(id);
    }
  }, [loadCanvas]);

  const startRename = useCallback((id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const finishRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      renameCanvas(editingId, editValue.trim());
    }
    setEditingId(null);
  }, [editingId, editValue, renameCanvas]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "2px 14px 0",
        flexShrink: 0,
        overflow: "auto",
      }}
    >
      <AnimatePresence mode="popLayout">
        {canvases.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => handleSwitch(c.id)}
            onDoubleClick={() => startRename(c.id, c.name)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              color: activeCanvasId === c.id ? "var(--text)" : "var(--text-muted)",
              background: activeCanvasId === c.id ? "var(--glass-hover)" : "transparent",
              border: activeCanvasId === c.id
                ? "1px solid var(--glass-border)"
                : "1px solid transparent",
              transition: "all 0.12s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {editingId === c.id ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 80,
                  fontSize: 11,
                  padding: "1px 4px",
                  borderRadius: 4,
                  border: "1px solid var(--accent)",
                  background: "var(--bg-1)",
                  color: "var(--text)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <span>{c.name}</span>
            )}
            {canvases.length > 1 && (
              <span
                onClick={(e) => handleDelete(e, c.id)}
                style={{
                  fontSize: 10,
                  opacity: 0.4,
                  cursor: "pointer",
                  padding: "0 2px",
                  borderRadius: 4,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
              >
                ✕
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        onClick={handleAdd}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: "1px solid var(--glass-border)",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginLeft: 4,
        }}
        title="New canvas"
      >
        +
      </button>
    </div>
  );
}
