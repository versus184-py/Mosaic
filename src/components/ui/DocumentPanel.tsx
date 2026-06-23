import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRagStore } from "../../store/ragStore";
import { useDocumentParser } from "../../hooks/useDocumentParser";
import { useToastStore } from "../../store/toastStore";

interface DocumentPanelProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentPanel({ open, onClose }: DocumentPanelProps) {
  const documents = useRagStore((s) => s.documents);
  const removeDocument = useRagStore((s) => s.removeDocument);
  const clearDocuments = useRagStore((s) => s.clearDocuments);
  const enabled = useRagStore((s) => s.enabled);
  const setEnabled = useRagStore((s) => s.setEnabled);
  const { parseFiles } = useDocumentParser();
  const addToast = useToastStore((s) => s.addToast);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async () => {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) return;
    setParsing(true);
    try {
      const result = await parseFiles(files);
      if (result.success > 0) {
        addToast(`Added ${result.success} document(s)`, "success");
      }
      if (result.errors.length > 0) {
        addToast(result.errors[0], "error");
      }
    } catch (e: any) {
      addToast(e.message || "Parse failed", "error");
    }
    setParsing(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [parseFiles, addToast]);

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
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="glass-container"
            style={{
              position: "fixed", top: 48, left: 20, bottom: 20,
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
                  Documents
                </h2>
                <button onClick={onClose} style={closeBtnStyle} title="Close">✕</button>
              </div>

              <label style={toggleRowStyle}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>RAG enabled</span>
                <div
                  onClick={() => setEnabled(!enabled)}
                  style={{
                    width: 34, height: 20, borderRadius: 10,
                    background: enabled ? "var(--accent)" : "var(--glass-border)",
                    position: "relative", transition: "background 0.2s", cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2, transition: "left 0.2s",
                    left: enabled ? 16 : 2,
                  }} />
                </div>
              </label>

              <div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".txt,.md,.json,.csv,.py,.js,.ts,.jsx,.tsx,.rs,.go,.java,.c,.cpp,.css,.html,.xml,.yaml,.yml"
                  multiple
                  onChange={handleUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={parsing}
                  style={uploadBtnStyle}
                >
                  {parsing ? "Parsing..." : "+ Upload documents"}
                </button>
              </div>

              {documents.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {documents.length} document(s)
                    </span>
                    <button
                      onClick={clearDocuments}
                      style={{ fontSize: 10, color: "#f56", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Clear all
                    </button>
                  </div>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px", borderRadius: 10,
                        background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                      }}
                    >
                      <span style={{ fontSize: 14, opacity: 0.5 }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {doc.chunks.length} chunks · {(doc.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        style={{
                          fontSize: 10, color: "var(--text-muted)", background: "none",
                          border: "none", cursor: "pointer", opacity: 0.5,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {documents.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                  No documents yet. Upload text files to use as context for your conversations.
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const closeBtnStyle: React.CSSProperties = {
  width: 28, height: 28, fontSize: 12,
  background: "transparent", border: "none",
  color: "var(--text-muted)", cursor: "pointer",
  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
};

const uploadBtnStyle: React.CSSProperties = {
  width: "100%", padding: "8px 0", fontSize: 11, fontWeight: 500,
  background: "var(--accent-alpha)", border: "1px solid var(--accent)",
  color: "var(--accent)", cursor: "pointer",
  borderRadius: 8, textAlign: "center",
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "4px 0", cursor: "pointer",
};
