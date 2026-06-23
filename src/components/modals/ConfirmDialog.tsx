import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, onCancel, destructive,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
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
              width: 300, padding: 24, borderRadius: 20,
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
            <div className="glass-filter-layer" style={{ borderRadius: 20 }} />
            <div className="glass-tint-layer" style={{ borderRadius: 20 }} />
            <div className="glass-shine-layer" style={{ borderRadius: 20 }} />
            <div className="glass-content-layer" style={{ display: "flex", flexDirection: "column", gap: 16, position: "static" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              {message}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onCancel} style={cancelBtnStyle}>
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  ...confirmBtnStyle,
                  background: destructive ? "rgba(255,60,60,0.15)" : "var(--accent-alpha)",
                  color: destructive ? "#f56" : "var(--accent)",
                  borderColor: destructive ? "rgba(255,60,60,0.3)" : "var(--accent)",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px", fontSize: 12, fontWeight: 500,
  background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
  color: "var(--text-secondary)", cursor: "pointer",
  borderRadius: 10, transition: "all 0.15s",
};

const confirmBtnStyle: React.CSSProperties = {
  padding: "8px 16px", fontSize: 12, fontWeight: 600,
  border: "1px solid", cursor: "pointer",
  borderRadius: 10, transition: "all 0.15s",
};
