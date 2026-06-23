import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyticsStore } from "../../store/analyticsStore";
import { useCanvasManagerStore } from "../../store/canvasManagerStore";
import { useCanvasStore } from "../../store/canvasStore";

interface AnalyticsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AnalyticsPanel({ open, onClose }: AnalyticsPanelProps) {
  const canvasId = useCanvasManagerStore((s) => s.activeCanvasId);
  const stats = useAnalyticsStore((s) => s.stats[canvasId]);
  const resetCanvasStats = useAnalyticsStore((s) => s.resetCanvasStats);
  const computeNodeStats = useAnalyticsStore((s) => s.computeNodeStats);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const nodeStats = useMemo(
    () => computeNodeStats(nodes, edges),
    [nodes, edges, computeNodeStats]
  );

  const modelBreakdown = stats?.modelBreakdown || {};
  const totalTokens = stats?.totalTokens || 0;
  const totalCost = stats?.totalCost || 0;
  const modelEntries = Object.entries(modelBreakdown);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 98,
              background: "var(--dialog-bg)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="glass-container"
            style={{
              position: "fixed", top: 48, right: 20, bottom: 20,
              width: 320, zIndex: 99,
              borderRadius: 20,
              padding: 20,
              overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
            <div className="glass-filter-layer" style={{ borderRadius: 20 }} />
            <div className="glass-tint-layer" style={{ borderRadius: 20 }} />
            <div className="glass-shine-layer" style={{ borderRadius: 20 }} />
            <div className="glass-content-layer" style={{ display: "flex", flexDirection: "column", gap: 16, position: "static" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  Analytics
                </h2>
                <button onClick={onClose} style={closeBtnStyle} title="Close">✕</button>
              </div>

              <Section label="Canvas">
                <StatRow label="Total nodes" value={nodeStats.totalNodes} />
                <StatRow label="Root threads" value={nodeStats.rootNodes} />
                <StatRow label="Branch nodes" value={nodeStats.branchNodes} />
                <StatRow label="Response nodes" value={nodeStats.responseNodes} />
                <StatRow label="Total messages" value={nodeStats.totalMessages} />
                <StatRow label="Max depth" value={nodeStats.depth} />
                <StatRow label="Branch points" value={nodeStats.branchCount} />
              </Section>

              <Section label="Usage">
                <StatRow label="Total tokens" value={totalTokens.toLocaleString()} />
                <StatRow label="Estimated cost" value={`$${totalCost.toFixed(4)}`} />
                {totalTokens > 0 && (
                  <StatRow label="Avg tokens/msg" value={Math.round(totalTokens / Math.max(nodeStats.totalMessages, 1)).toLocaleString()} />
                )}
              </Section>

              {modelEntries.length > 0 && (
                <Section label="Per Model">
                  {modelEntries.map(([model, data]) => (
                    <div key={model} style={{ padding: "6px 8px", borderRadius: 8, background: "var(--glass-hover)", marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{model}</div>
                      <StatRow label="Tokens" value={data.tokens.toLocaleString()} />
                      <StatRow label="Cost" value={`$${data.cost.toFixed(4)}`} />
                      <StatRow label="Completions" value={data.count} />
                    </div>
                  ))}
                </Section>
              )}

              {stats && (
                <button
                  onClick={() => resetCanvasStats(canvasId)}
                  style={{
                    fontSize: 11, color: "#f56", background: "none",
                    border: "1px solid rgba(255,60,60,0.3)", borderRadius: 8,
                    padding: "6px 0", cursor: "pointer",
                  }}
                >
                  Reset analytics
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
        letterSpacing: 0.5, textTransform: "uppercase",
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0" }}>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

const closeBtnStyle: React.CSSProperties = {
  width: 28, height: 28, fontSize: 12,
  background: "transparent", border: "none",
  color: "var(--text-muted)", cursor: "pointer",
  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
};
