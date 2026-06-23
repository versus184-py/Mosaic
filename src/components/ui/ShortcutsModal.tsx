import { motion, AnimatePresence } from "framer-motion";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const groups: { label: string; shortcuts: { keys: string; desc: string }[] }[] = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: "Click node", desc: "Select & reply" },
      { keys: "Esc", desc: "Deselect node" },
    ],
  },
  {
    label: "Editing",
    shortcuts: [
      { keys: "Enter", desc: "Send message" },
      { keys: "Shift+Enter", desc: "New line" },
      { keys: "Del / Backspace", desc: "Delete selected node" },
    ],
  },
  {
    label: "Canvas",
    shortcuts: [
      { keys: "Ctrl+F", desc: "Search nodes" },
      { keys: "Ctrl+Z", desc: "Undo position" },
      { keys: "Ctrl+N", desc: "New chat" },
      { keys: "F", desc: "Fit view" },
      { keys: "+ / -", desc: "Zoom in / out" },
    ],
  },
  {
    label: "General",
    shortcuts: [
      { keys: "?", desc: "Show shortcuts" },
      { keys: "Ctrl+, / ≡", desc: "Settings" },
    ],
  },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--dialog-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-container"
            style={{
              width: 360, maxHeight: "80vh", padding: 24, borderRadius: 20,
              display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
            }}
          >
            <div className="glass-filter-layer" style={{ borderRadius: 20 }} />
            <div className="glass-tint-layer" style={{ borderRadius: 20 }} />
            <div className="glass-shine-layer" style={{ borderRadius: 20 }} />
            <div className="glass-content-layer" style={{ display: "flex", flexDirection: "column", gap: 20, position: "static" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, fontSize: 12,
                  background: "transparent", border: "none",
                  color: "var(--text-muted)", cursor: "pointer",
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {groups.map((group) => (
              <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
                  letterSpacing: 0.5, textTransform: "uppercase",
                }}>
                  {group.label}
                </span>
                {group.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.desc}</span>
                    <kbd style={{
                      fontSize: 11, padding: "2px 7px", borderRadius: 6,
                      background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                      fontFamily: "inherit", color: "var(--text)", whiteSpace: "nowrap",
                    }}>
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            ))}
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
