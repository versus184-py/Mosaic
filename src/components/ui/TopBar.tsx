import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "../../store/uiStore";
import { useToastStore } from "../../store/toastStore";
import { DocumentPanel } from "./DocumentPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { useDistillation } from "../../hooks/useDistillation";
import { useBranchPruning } from "../../hooks/useBranchPruning";
import { usePruneStore } from "../../store/pruneStore";
import type { ProviderId } from "../../types/canvas";

interface TopBarProps {
  onNewChat: () => void;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  mistral: "Mistral",
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
  ollama: "Ollama",
};

const PROVIDER_COLORS: Record<ProviderId, string> = {
  mistral: "hsla(215, 70%, 65%, 0.9)",
  openai: "hsla(145, 60%, 50%, 0.9)",
  anthropic: "hsla(25, 80%, 60%, 0.9)",
  gemini: "hsla(55, 75%, 55%, 0.9)",
  ollama: "hsla(275, 60%, 65%, 0.9)",
};

export function TopBar({ onNewChat }: TopBarProps) {
  const model = useUIStore((s) => s.model);
  const setModel = useUIStore((s) => s.setModel);
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const showBookmarksOnly = useUIStore((s) => s.showBookmarksOnly);
  const setShowBookmarksOnly = useUIStore((s) => s.setShowBookmarksOnly);
  const getAvailableModels = useUIStore((s) => s.getAvailableModels);
  const [open, setOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [pruneGoal, setPruneGoal] = useState("");
  const [showPruneInput, setShowPruneInput] = useState(false);
  const { distill, isDistilling } = useDistillation();
  const { pruneCanvas } = useBranchPruning();
  const pruneActive = usePruneStore((s) => s.pruneActive);
  const ref = useRef<HTMLDivElement>(null);
  const pruneRef = useRef<HTMLDivElement>(null);

  const models = getAvailableModels();
  const current = models.find((m) => m.id === model);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 14px",
        flexShrink: 0,
        minHeight: 36,
        WebkitAppRegion: "drag",
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: -0.2,
          }}
        >
          ◉ Mosaic
        </span>
      </div>

      <div
        style={{ display: "flex", gap: 2, alignItems: "center", WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Model dropdown */}
        <div ref={ref} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 8, fontSize: 12,
              background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: current ? PROVIDER_COLORS[current.provider] : "hsla(220, 60%, 70%, 0.9)",
            }} />
            {current?.label || "Select model"}
            <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
          </button>

          {open && (
            <div
              style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4,
                minWidth: 200, padding: 4,
                background: "var(--bg-1)", border: "1px solid var(--glass-border)",
                borderRadius: 12, zIndex: 50,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {(["mistral", "openai", "anthropic", "gemini", "ollama"] as ProviderId[]).map((provider) => {
                const group = models.filter((m) => m.provider === provider);
                if (group.length === 0) return null;
                return (
                  <div key={provider}>
                    <div style={{
                      padding: "4px 10px 2px", fontSize: 10, fontWeight: 600,
                      color: "var(--text-muted)", letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}>
                      {PROVIDER_LABELS[provider]}
                    </div>
                    {group.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setModel(m.id); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "6px 10px", borderRadius: 8,
                          background: model === m.id ? "var(--accent-alpha)" : "transparent",
                          border: "none", color: "var(--text)", fontSize: 12,
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.1s",
                        }}
                      >
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          background: PROVIDER_COLORS[provider],
                        }} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => setSearchOpen(true)} style={btnStyle} title="Search (Ctrl+F)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          style={{
            ...btnStyle,
            color: showBookmarksOnly ? "var(--accent)" : "var(--text-muted)",
          }}
          title={showBookmarksOnly ? "Show all nodes" : "Show bookmarked only"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={showBookmarksOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
        <button onClick={() => setDocsOpen(true)} style={btnStyle} title="Documents (RAG)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        </button>
        <button onClick={() => setAnalyticsOpen(true)} style={btnStyle} title="Analytics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
        </button>
        <button onClick={distill} disabled={isDistilling}
          style={{ ...btnStyle, opacity: isDistilling ? 0.5 : 1 }}
          title="Distill canvas into synthesis">
          {isDistilling ? (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5 }}>◈</motion.span>
          ) : "◈"}
        </button>
        <div ref={pruneRef} style={{ position: "relative" }}>
          <button onClick={() => setShowPruneInput(!showPruneInput)}
            style={{ ...btnStyle, color: pruneActive ? "var(--accent)" : "var(--text-muted)" }}
            title={pruneActive ? "Pruning active" : "Prune branches"}>
            ⊜
          </button>
          {showPruneInput && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 4,
              background: "var(--bg-1)", border: "1px solid var(--glass-border)",
              borderRadius: 12, padding: 8, zIndex: 50, minWidth: 220,
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            }}>
              <input
                value={pruneGoal}
                onChange={(e) => setPruneGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pruneGoal.trim()) {
                    usePruneStore.getState().setPruneGoal(pruneGoal.trim());
                    usePruneStore.getState().setPruneActive(true);
                    pruneCanvas(pruneGoal.trim());
                    setShowPruneInput(false);
                  }
                }}
                placeholder="What is your goal?"
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 8,
                  background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                  color: "var(--text)", fontSize: 12, outline: "none",
                }}
                autoFocus
              />
            </div>
          )}
        </div>
        <button onClick={onNewChat} style={btnStyle} title="New thread">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
        <button onClick={toggleSettings} style={btnStyle} title="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
      <DocumentPanel open={docsOpen} onClose={() => setDocsOpen(false)} />
      <AnalyticsPanel open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  fontSize: 13,
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
};
