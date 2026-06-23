import { motion, AnimatePresence } from "framer-motion";
import { useToastStore, type ToastType } from "../../store/toastStore";

const iconMap: Record<ToastType, string> = {
  info: "◎",
  success: "✓",
  error: "✕",
};

const colorMap: Record<ToastType, string> = {
  info: "var(--accent)",
  success: "#3c8",
  error: "#f56",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      style={{
        position: "fixed", top: 50, left: "50%", transform: "translateX(-50%)",
        zIndex: 300, display: "flex", flexDirection: "column", gap: 8,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="glass-container"
            style={{
              padding: "10px 18px", borderRadius: 14,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, color: "var(--text)", borderLeft: `3px solid ${colorMap[toast.type]}`,
              pointerEvents: "auto", whiteSpace: "nowrap",
            }}
            onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
          >
            <div className="glass-filter-layer" />
            <div className="glass-tint-layer" />
            <div className="glass-shine-layer" />
            <div className="glass-content-layer" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: colorMap[toast.type], fontSize: 14 }}>{iconMap[toast.type]}</span>
            {toast.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
