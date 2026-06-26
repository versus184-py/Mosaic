import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

interface NodeInputProps {
  onSend: (text: string) => void;
  onDebate?: (text: string) => void;
  initialValue?: string;
}

export function NodeInput({ onSend, onDebate, initialValue }: NodeInputProps) {
  const [value, setValue] = useState(initialValue || "");
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const MAX_INPUT_LENGTH = 10000;

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    if (transcript) {
      setValue((prev) => {
        const merged = prev ? prev + " " + transcript : transcript;
        return merged;
      });
    }
  }, [transcript]);

  const handleSend = useCallback(() => {
    const raw = value.length > MAX_INPUT_LENGTH ? value.substring(0, MAX_INPUT_LENGTH) : value;
    const trimmed = raw.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (onDebate) {
          const raw = value.length > MAX_INPUT_LENGTH ? value.substring(0, MAX_INPUT_LENGTH) : value;
          const trimmed = raw.trim();
          if (trimmed) {
            onDebate(trimmed);
            setValue("");
          }
        }
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, onDebate, value]
  );

  const handleMicClick = useCallback(() => {
    if (isListening) {
      const result = stopListening();
      if (result) {
        setValue((prev) => {
          const merged = prev ? prev + " " + result : result;
          return merged;
        });
      }
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "flex-end",
        paddingTop: 8,
        borderTop: "1px solid var(--glass-border)",
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Type your message..."
        rows={1}
        style={{
          flex: 1,
          background: focused ? "var(--glass-active)" : "var(--glass-hover)",
          border: focused
            ? "1px solid var(--accent)"
            : "1px solid var(--glass-border)",
          borderRadius: 12,
          padding: "10px 14px",
          color: "var(--text)",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          resize: "none",
          lineHeight: 1.5,
          transition: "all 0.15s",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        {isSupported && (
          <motion.button
            onClick={handleMicClick}
            whileTap={{ scale: 0.9 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: isListening
                ? "rgba(255,60,60,0.2)"
                : "var(--glass-hover)",
              border: isListening
                ? "1px solid rgba(255,60,60,0.4)"
                : "1px solid var(--glass-border)",
              color: isListening ? "#f56" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
              transition: "all 0.15s",
              position: "relative",
            }}
            title={isListening ? "Stop recording" : "Voice input"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            {isListening && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  position: "absolute",
                  inset: -2,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,60,60,0.3)",
                }}
              />
            )}
          </motion.button>
        )}
        <button
          onClick={handleSend}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: value.trim()
              ? "var(--accent)"
              : "var(--glass-hover)",
            border: "none",
            color: value.trim() ? "#fff" : "var(--text-muted)",
            cursor: value.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
