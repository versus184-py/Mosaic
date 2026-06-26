import { usePruneStore } from "../../store/pruneStore";
import { useBranchPruning } from "../../hooks/useBranchPruning";

export function PruneBanner() {
  const { pruneActive, pruneGoal, isPruning } = usePruneStore();
  const { clearPrune } = useBranchPruning();

  if (!pruneActive) return null;

  return (
    <div style={{
      position: "fixed", bottom: 48, left: "50%", transform: "translateX(-50%)",
      background: "var(--bg-1)", border: "1px solid var(--glass-border)",
      borderRadius: 12, padding: "6px 14px", display: "flex", gap: 10,
      alignItems: "center", fontSize: 12, color: "var(--text-secondary)",
      backdropFilter: "blur(20px)", zIndex: 50,
    }}>
      {isPruning ? "◌ Scoring branches..." : `◉ Pruning for: "${pruneGoal}"`}
      {!isPruning && (
        <button onClick={clearPrune} style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
          Restore all
        </button>
      )}
    </div>
  );
}
