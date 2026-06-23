import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  items: {
    label: string;
    shortcut?: string;
    icon?: string;
    action: () => void;
    destructive?: boolean;
    disabled?: boolean;
  }[];
}

export function ContextMenu({ open, x, y, onClose, items }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 16);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escape);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ scale: 0.92, opacity: 0, originX: 0, originY: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="glass-container"
          style={{
            position: "fixed", left: adjustedX, top: adjustedY, zIndex: 200,
            minWidth: 160, padding: 4, borderRadius: 12,
          }}>
            <div className="glass-filter-layer" />
            <div className="glass-tint-layer" />
            <div className="glass-shine-layer" />
            <div className="glass-content-layer" style={{ position: "static" }}>
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "6px 10px",
                fontSize: 12, color: item.destructive ? "#f56" : item.disabled ? "var(--text-muted)" : "var(--text-secondary)",
                background: "transparent", border: "none", borderRadius: 8,
                cursor: item.disabled ? "default" : "pointer",
                textAlign: "left", transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) e.currentTarget.style.background = "var(--glass-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item.icon && <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.shortcut && (
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.shortcut}</span>
              )}
            </button>
          ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
