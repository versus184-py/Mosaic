import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../../store/uiStore";
import { useCanvasStore } from "../../store/canvasStore";

export function SearchOverlay() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const nodes = useCanvasStore((s) => s.nodes);
  const setActiveNode = useCanvasStore((s) => s.setActiveNode);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchIndex, setSearchIndex] = useState(-1);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setSearchIndex(-1);
  }, [searchOpen, searchQuery, setSearchIndex]);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes
      .map((n) => {
        const labelMatch = n.data.label.toLowerCase().includes(q);
        const contentMatch = n.data.messages.some((m) =>
          m.content.toLowerCase().includes(q)
        );
        const match = labelMatch || contentMatch;
        return { node: n, match };
      })
      .filter((r) => r.match)
      .map((r) => r.node);
  }, [searchQuery, nodes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      } else if (e.key === "ArrowDown" && results.length > 0) {
        e.preventDefault();
        setSearchIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp" && results.length > 0) {
        e.preventDefault();
        setSearchIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && searchIndex >= 0 && results.length > 0) {
        e.preventDefault();
        setActiveNode(results[searchIndex].id);
        setSearchOpen(false);
        setSearchQuery("");
        setSearchIndex(-1);
      }
    },
    [results, searchIndex, setActiveNode, setSearchOpen, setSearchQuery]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setActiveNode(id);
      setSearchOpen(false);
      setSearchQuery("");
    },
    [setActiveNode, setSearchOpen, setSearchQuery]
  );

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed", top: 44, left: "50%", transform: "translateX(-50%)",
            zIndex: 60, width: 320,
          }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div
            className="glass-container glass-clarity"
            style={{
              borderRadius: 14, padding: 6, display: "flex", flexDirection: "column", gap: 2,
            }}
          >
            <div className="glass-filter-layer" />
            <div className="glass-tint-layer" />
            <div className="glass-shine-layer" />
            <div className="glass-content-layer" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 10,
                background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                color: "var(--text)", fontSize: 13, fontFamily: "inherit",
                outline: "none",
              }}
            />
            {results.length > 0 && (
              <div style={{ maxHeight: 240, overflow: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                {results.slice(0, 20).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "6px 10px", borderRadius: 8,
                      background: "transparent", border: "none",
                      color: "var(--text-secondary)", fontSize: 12,
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
                      background: node.data.nodeType === "root" ? "var(--accent)" : "var(--text-muted)",
                    }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {node.data.label || "(empty)"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {node.data.nodeType}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim() && results.length === 0 && (
              <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-muted)" }}>
                No matches found
              </div>
            )}
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
