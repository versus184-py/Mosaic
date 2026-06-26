import { useState, useCallback, ReactNode } from "react";
import { runCode } from "../../utils/codeRunner";
import { useToastStore } from "../../store/toastStore";

interface CodeBlockProps {
  className?: string;
  children: ReactNode;
}

const LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  js: "javascript",
  typescript: "javascript",
  ts: "javascript",
  python: "python",
  py: "python",
};

export function CodeBlock({ className, children }: CodeBlockProps) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const lang = className?.replace("language-", "") || "";
  const code = extractCode(children);
  const codeTrimmed = code.replace(/^\n|\n$/g, "");
  const execLang = LANG_MAP[lang];
  const lineCount = code.split("\n").length;

  const [showConfirm, setShowConfirm] = useState(false);

  const executeCode = useCallback(async () => {
    if (!execLang) {
      addToast(`Cannot execute ${lang}`, "error");
      return;
    }
    setRunning(true);
    setOutput(null);
    setError(null);
    try {
      const result = await runCode(execLang, codeTrimmed);
      if ("error" in result) {
        setError(result.error);
        addToast(`Execution error: ${result.error}`, "error");
      } else {
        const out = result.output || result.result || "(no output)";
        setOutput(out);
        addToast("Code executed", "success");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }, [execLang, codeTrimmed, lang, addToast]);

  const handleRun = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmRun = useCallback(() => {
    setShowConfirm(false);
    executeCode();
  }, [executeCode]);

  const isCode = !!execLang;

  return (
    <div style={{ position: "relative", margin: "6px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "2px 8px", fontSize: 10, color: "var(--text-muted)",
        background: "var(--bg-1)",
        borderRadius: collapsed && !output && !error ? 10 : "10px 10px 0 0",
        border: "1px solid var(--glass-border)",
        borderBottom: collapsed && !output && !error ? "1px solid var(--glass-border)" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
            style={{
              fontSize: 10, background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer", padding: "4px 2px",
              transition: "transform 0.15s",
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </button>
          <span>{lang || "code"}</span>
          {collapsed && <span style={{ opacity: 0.5 }}>({lineCount} lines)</span>}
        </div>
        {isCode && (
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6,
              background: running ? "var(--glass-hover)" : "var(--accent-alpha)",
              border: running ? "1px solid var(--glass-border)" : "1px solid var(--accent)",
              color: running ? "var(--text-muted)" : "var(--accent)",
              cursor: running ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {running ? "⏳ Running..." : "▶ Run"}
          </button>
        )}
      </div>

      <div style={{ display: collapsed ? "none" : "block" }}>
        <pre
          style={{
            background: "var(--bg-1)", padding: 10, margin: 0,
            overflow: "auto", fontSize: 12, lineHeight: 1.5,
            borderLeft: "1px solid var(--glass-border)",
            borderRight: "1px solid var(--glass-border)",
            borderBottom: output || error ? "none" : "1px solid var(--glass-border)",
          }}
        >
          <code className={className}>{children}</code>
        </pre>

        {(output || error) && (
          <div
            style={{
              background: error ? "rgba(255,60,60,0.08)" : "var(--accent-alpha)",
              border: error ? "1px solid rgba(255,60,60,0.2)" : "1px solid var(--glass-border)",
              borderTop: "none",
              borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
              padding: "8px 10px", fontSize: 12, lineHeight: 1.5,
              fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all",
              color: error ? "#f56" : "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: error ? "#f56" : "var(--text-muted)" }}>
                {error ? "Error" : "Output"}
              </span>
              <button
                onClick={() => { setOutput(null); setError(null); }}
                style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: "inherit", fontFamily: "inherit", whiteSpace: "pre-wrap" }}>
              {error || output}
            </pre>
          </div>
        )}

        {showConfirm && (
          <div
            style={{
              background: "var(--bg-1)", border: "1px solid var(--glass-border)",
              borderTop: "none",
              borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
              padding: "10px 12px", fontSize: 12, lineHeight: 1.5,
            }}
          >
            <div style={{ marginBottom: 8, color: "var(--text)", fontWeight: 500 }}>
              Run this code?
            </div>
            <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-muted)" }}>
              This code was generated by AI. Review it before running.
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 11,
                  background: "var(--glass-hover)", border: "1px solid var(--glass-border)",
                  color: "var(--text-secondary)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRun}
                style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 11,
                  background: "var(--accent-alpha)", border: "1px solid var(--accent)",
                  color: "var(--accent)", cursor: "pointer",
                }}
              >
                Run anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function extractCode(children: ReactNode): string {
  const kids = Array.isArray(children) ? children : [children];
  return kids.map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return "";
  }).join("");
}
