import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HINT_KEY = "mosaic-hint-dismissed";

export function OnboardingHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(HINT_KEY)) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(HINT_KEY, "1");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
            zIndex: 50, pointerEvents: "none",
          }}
        >
          <div
            className="glass-container"
            style={{
              padding: "12px 20px", borderRadius: 16,
              display: "flex", alignItems: "center", gap: 12,
              pointerEvents: "auto",
            }}
          >
            <div className="glass-filter-layer" />
            <div className="glass-tint-layer" />
            <div className="glass-shine-layer" />
            <div className="glass-content-layer" style={{ display: "flex", alignItems: "center", gap: 12, position: "static" }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
              <strong style={{ color: "var(--text)" }}>Click a node</strong> to reply, or press <kbd style={kbdStyle}>+</kbd> to start fresh
            </div>
            <button
              onClick={dismiss}
              style={{
                fontSize: 12, color: "var(--text-muted)", background: "none",
                border: "none", cursor: "pointer", padding: "2px 6px",
              }}
            >
              ✕
            </button>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const kbdStyle: React.CSSProperties = {
  fontSize: 11, padding: "1px 5px", borderRadius: 4,
  background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
  fontFamily: "inherit",
};
