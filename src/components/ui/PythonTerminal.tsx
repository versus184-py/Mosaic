import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { replExec, replReset } from "../../utils/codeRunner";

interface Entry {
  type: "input" | "output" | "error" | "system";
  text: string;
}

export function PythonTerminal() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([
    { type: "system", text: "Python REPL (Pyodide). Type code or: pip install <package>" },
  ]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || running) return;

    setEntries((prev) => [...prev, { type: "input", text: `>>> ${trimmed}` }]);
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);
    setInput("");
    setRunning(true);

    if (trimmed === "reset()" || trimmed === "!reset") {
      const res = await replReset();
      if ("error" in res) {
        setEntries((prev) => [...prev, { type: "error", text: res.error }]);
      } else {
        setEntries((prev) => [...prev, { type: "system", text: res.output || "REPL reset" }]);
      }
      setRunning(false);
      return;
    }

    if (trimmed === "clear()" || trimmed === "!clear") {
      setEntries([]);
      setRunning(false);
      return;
    }

    try {
      const result = await replExec(trimmed);
      setEntries((prev) => [
        ...prev,
        ...("error" in result
          ? [{ type: "error" as const, text: result.error }]
          : result.output
            ? [{ type: "output" as const, text: result.output }]
            : [{ type: "output" as const, text: "(no output)" }]),
      ]);
    } catch (e: any) {
      setEntries((prev) => [...prev, { type: "error", text: e.message }]);
    }
    setRunning(false);
  }, [input, running]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIdx === -1) return;
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    },
    [handleSubmit, history, historyIdx]
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: open ? undefined : 70, right: 20,
          zIndex: 90,
          width: 36, height: 36, borderRadius: "50%",
          background: open ? "rgba(255,60,60,0.2)" : "var(--accent-alpha)",
          border: open ? "1px solid rgba(255,60,60,0.3)" : "1px solid var(--accent)",
          color: open ? "#f56" : "var(--accent)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, backdropFilter: "blur(10px)",
        }}
        title={open ? "Close terminal" : "Open Python terminal"}
      >
        {open ? "✕" : ">_"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{
              position: "fixed", bottom: 70, right: 20,
              width: 520, height: 320,
              zIndex: 90,
              borderRadius: 16,
              display: "flex", flexDirection: "column",
              background: "var(--bg-1)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 12px",
              borderBottom: "1px solid var(--glass-border)",
              fontSize: 11, color: "var(--text-muted)", fontWeight: 600,
              flexShrink: 0,
            }}>
              <span>Python REPL — <span style={{ fontWeight: 400 }}>state persists between commands</span></span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, padding: "2px 6px" }}
              >
                ✕
              </button>
            </div>

            <div style={{
              flex: 1, overflow: "auto", padding: "8px 12px",
              fontFamily: "monospace", fontSize: 12, lineHeight: 1.6,
            }}>
              {entries.map((entry, i) => (
                <div key={i} style={{
                  color: entry.type === "input" ? "var(--accent)"
                    : entry.type === "error" ? "#f56"
                    : entry.type === "system" ? "var(--text-muted)"
                    : "var(--text-secondary)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {entry.text}
                </div>
              ))}

              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ color: "var(--accent)", flexShrink: 0 }}>&gt;&gt;&gt;</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={running}
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    color: "var(--text)", fontFamily: "inherit", fontSize: 12,
                    outline: "none",
                  }}
                />
                {running && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>running...</span>}
              </div>
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
