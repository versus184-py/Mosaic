import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore, type ThemeName } from "../../store/uiStore";
import { useCanvasStore } from "../../store/canvasStore";
import { useCanvasManagerStore } from "../../store/canvasManagerStore";
import { useToastStore } from "../../store/toastStore";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import { ShortcutsModal } from "./ShortcutsModal";
import { setApiKey as persistApiKey, hasApiKey, PROVIDER_DEFS } from "../../api/config";
import type { ProviderId } from "../../types/canvas";
import { validateImportedCanvas } from "../../utils/validation";
import { checkOllamaConnection, listOllamaModels } from "../../api/ollama";
import { TactileSwitch } from "../glass/TactileSwitch";
import { FluidSlider } from "../glass/FluidSlider";

const themes: { id: ThemeName; label: string; desc: string }[] = [
  { id: "void", label: "◉ Void", desc: "Dark, cold, minimal" },
  { id: "dusk", label: "◉ Dusk", desc: "Dark, cosmic, rich" },
  { id: "sand", label: "◉ Sand", desc: "Light, desert, warm" },
  { id: "snow", label: "◉ Snow", desc: "Light, clean, crisp" },
  { id: "sunrise", label: "◉ Sunrise", desc: "Light, golden, bright" },
];

const KEY_PROVIDERS: { id: ProviderId; label: string; keyLabel: string }[] = [
  { id: "mistral", label: "Mistral", keyLabel: "Mistral API Key" },
  { id: "openai", label: "OpenAI", keyLabel: "OpenAI API Key" },
  { id: "anthropic", label: "Anthropic", keyLabel: "Anthropic API Key" },
  { id: "gemini", label: "Gemini", keyLabel: "Gemini API Key" },
];

function ApiKeySection({ providerId, label, keyLabel }: { providerId: ProviderId; label: string; keyLabel: string }) {
  const addToast = useToastStore((s) => s.addToast);
  const [keyDraft, setKeyDraft] = useState(hasApiKey(providerId) ? "********" : "");
  const [hasValue, setHasValue] = useState(hasApiKey(providerId));
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const handleSave = () => {
    if (!keyDraft || keyDraft === "********") return;
    persistApiKey(providerId, keyDraft);
    setHasValue(true);
    setKeyDraft("********");
    setSaved(true);
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    timeoutRef.current = setTimeout(() => { setSaved(false); timeoutRef.current = null; }, 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>{keyLabel}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="password"
          value={keyDraft}
          onChange={(e) => { setKeyDraft(e.target.value); if (e.target.value !== "********") setHasValue(false); }}
          placeholder={hasValue ? "API key is set (type to replace)" : `Enter your ${label} API key...`}
          style={{
            flex: 1, padding: "8px 10px", borderRadius: 10,
            background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
            color: "var(--text)", fontSize: 12, fontFamily: "inherit",
            outline: "none",
          }}
        />
        {hasValue && !keyDraft.startsWith("********") && (
          <button
            onClick={() => { persistApiKey(providerId, ""); setHasValue(false); setKeyDraft(""); addToast(`${label} API key removed`, "info"); }}
            style={{
              padding: "8px 10px", borderRadius: 10,
              background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)",
              color: "#f56", cursor: "pointer", fontSize: 11, fontWeight: 500,
              whiteSpace: "nowrap",
            }}
            title="Remove API key"
          >
            ✕
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!keyDraft || keyDraft === "********"}
          style={{
            padding: "8px 14px", borderRadius: 10,
            background: saved ? "var(--accent-alpha)" : "var(--glass-hover)",
            border: saved ? "1px solid var(--accent)" : "1px solid var(--glass-border)",
            color: saved ? "var(--accent)" : "var(--text-secondary)",
            cursor: (keyDraft && keyDraft !== "********") ? "pointer" : "default",
            fontSize: 11, fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {saved ? "✓ Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function SettingsDrawer() {
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const showMiniMap = useUIStore((s) => s.showMiniMap);
  const toggleMiniMap = useUIStore((s) => s.toggleMiniMap);
  const confidenceEnabled = useUIStore((s) => s.confidenceEnabled);
  const setConfidenceEnabled = useUIStore((s) => s.setConfidenceEnabled);
  const tendrilsEnabled = useUIStore((s) => s.tendrilsEnabled);
  const setTendrilsEnabled = useUIStore((s) => s.setTendrilsEnabled);
  const systemPrompt = useUIStore((s) => s.systemPrompt);
  const setSystemPrompt = useUIStore((s) => s.setSystemPrompt);
  const temperature = useUIStore((s) => s.temperature);
  const setTemperature = useUIStore((s) => s.setTemperature);
  const ollamaConnected = useUIStore((s) => s.ollamaConnected);
  const setOllamaConnected = useUIStore((s) => s.setOllamaConnected);
  const setOllamaModels = useUIStore((s) => s.setOllamaModels);
  const ollamaUrl = useUIStore((s) => s.ollamaUrl);
  const setOllamaUrl = useUIStore((s) => s.setOllamaUrl);

  const importData = useCanvasStore((s) => s.importData);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const addToast = useToastStore((s) => s.addToast);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [promptDraft, setPromptDraft] = useState(systemPrompt);
  const [ollamaChecking, setOllamaChecking] = useState(false);

  useEffect(() => {
    if (!settingsOpen) {
      setSystemPrompt(promptDraft);
    }
  }, [settingsOpen]);

  const handleOllamaConnect = useCallback(async () => {
    setOllamaChecking(true);
    const connected = await checkOllamaConnection(ollamaUrl);
    setOllamaConnected(connected);
    if (connected) {
      const models = await listOllamaModels(ollamaUrl);
      setOllamaModels(models);
      addToast(`Ollama connected — ${models.length} models found`, "success");
    } else {
      setOllamaModels([]);
      addToast("Could not connect to Ollama", "error");
    }
    setOllamaChecking(false);
  }, [ollamaUrl, setOllamaConnected, setOllamaModels, addToast]);

  const handleExport = () => {
    const mgr = useCanvasManagerStore.getState();
    const canvasId = mgr.activeCanvasId;
    const raw = localStorage.getItem("mosaic-canvas-data-" + canvasId);
    if (!raw) { addToast("No data to export", "info"); return; }
    const canvasName = mgr.canvases.find((c) => c.id === canvasId)?.name || "canvas";
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mosaic-${canvasName.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Canvas exported", "success");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const validation = validateImportedCanvas(data);
          if (!validation.valid) { addToast(`Invalid canvas file: ${validation.errors[0]}`, "error"); return; }
          importData(data);
          addToast("Canvas imported", "success");
        } catch { addToast("Invalid canvas file", "error"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleSettings}
            style={{
              position: "fixed", inset: 0, zIndex: 98,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--dialog-bg)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <motion.aside
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="glass-container settings-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 500, maxHeight: "90vh", zIndex: 99,
                borderRadius: 20, padding: 28, overflowY: "auto",
                scrollbarWidth: "none", msOverflowStyle: "none",
                display: "flex", flexDirection: "column", gap: 24,
              }}
            >
            <div className="glass-content-layer" style={{ display: "flex", flexDirection: "column", gap: 24, position: "static" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Settings</h2>
              <button onClick={toggleSettings} style={closeBtnStyle} title="Close settings">✕</button>
            </div>

            <Section label="Theme">
              <Grid>
                {themes.map((t) => (
                  <Chip key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                    <span style={{ fontSize: 12 }}>{t.label}</span>
                    <span style={descStyle}>{t.desc}</span>
                  </Chip>
                ))}
              </Grid>
            </Section>

            <Section label="API Keys">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {KEY_PROVIDERS.map((p) => (
                  <ApiKeySection key={p.id} providerId={p.id} label={p.label} keyLabel={p.keyLabel} />
                ))}
              </div>
            </Section>

            <Section label="Ollama (Local)">
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  style={{
                    flex: 1, padding: "8px 10px", borderRadius: 10,
                    background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                    color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none",
                  }}
                />
                <button
                  onClick={handleOllamaConnect}
                  disabled={ollamaChecking}
                  style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: ollamaConnected ? "rgba(60,200,100,0.15)" : "var(--glass-hover)",
                    border: `1px solid ${ollamaConnected ? "rgba(60,200,100,0.3)" : "var(--glass-border)"}`,
                    color: ollamaConnected ? "#3cc864" : "var(--text-secondary)",
                    cursor: ollamaChecking ? "default" : "pointer",
                    fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
                  }}
                >
                  {ollamaChecking ? "◌" : ollamaConnected ? "✓ Connected" : "Connect"}
                </button>
              </div>
            </Section>

            <Section label="Personalization">
              <label style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: -4 }}>System instruction</label>
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                onBlur={() => setSystemPrompt(promptDraft)}
                rows={3}
                maxLength={4000}
                placeholder="Enter system instruction..."
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 10,
                  background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                  color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                  outline: "none", resize: "vertical", lineHeight: 1.4,
                }}
              />
              <FluidSlider
                min={0} max={2} step={0.1}
                value={temperature}
                onChange={setTemperature}
                label={`Temperature: ${temperature.toFixed(1)}`}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: -4 }}>
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </Section>

            <Section label="Canvas">
              <TactileSwitch label="Minimap" checked={showMiniMap} onChange={toggleMiniMap} />
              <TactileSwitch label="Confidence scoring" checked={confidenceEnabled} onChange={() => setConfidenceEnabled(!confidenceEnabled)} />
              <TactileSwitch label="Follow-up suggestions" checked={tendrilsEnabled} onChange={() => setTendrilsEnabled(!tendrilsEnabled)} />
              <button onClick={autoLayout} style={dataBtnStyle} title="Auto-arrange nodes">⊞ Auto arrange</button>
            </Section>

            <Section label="Data">
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleExport} style={dataBtnStyle} title="Export canvas JSON">↓ Export</button>
                <button onClick={handleImport} style={dataBtnStyle} title="Import canvas JSON">↑ Import</button>
                <button onClick={() => setShowClearConfirm(true)} style={{ ...dataBtnStyle, color: "#f56" }} title="Clear all nodes">✕ Clear</button>
              </div>
            </Section>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowShortcuts(true)} style={dataBtnStyle} title="Keyboard shortcuts">⌨ Shortcuts</button>
            </div>
          </div>
          </motion.aside>
          </motion.div>

          <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
          <ConfirmDialog
            open={showClearConfirm}
            title="Clear canvas?"
            message="This will remove all nodes and cannot be undone."
            confirmLabel="Clear all"
            cancelLabel="Cancel"
            onConfirm={() => { clearCanvas(); setShowClearConfirm(false); addToast("Canvas cleared", "info"); }}
            onCancel={() => setShowClearConfirm(false)}
            destructive
          />
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{children}</div>;
}

function Chip({ active, onClick, children, style: extraStyle }: { active: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px", borderRadius: 10,
      background: active ? "var(--accent-alpha)" : "var(--glass-hover)",
      border: active ? "1px solid var(--accent)" : "1px solid transparent",
      color: active ? "var(--accent)" : "var(--text-secondary)",
      cursor: "pointer", fontSize: 12, textAlign: "left", transition: "all 0.15s", ...extraStyle,
    }}>
      {children}
    </button>
  );
}

const descStyle: React.CSSProperties = { fontSize: 10, color: "var(--text-muted)", lineHeight: 1.2 };
const closeBtnStyle: React.CSSProperties = { width: 28, height: 28, fontSize: 12, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" };
const dataBtnStyle: React.CSSProperties = { flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 500, background: "var(--glass-hover)", border: "1px solid var(--glass-border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: 8, textAlign: "center", transition: "all 0.15s" };