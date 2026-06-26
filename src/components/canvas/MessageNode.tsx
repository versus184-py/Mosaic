import { memo, useState, useCallback, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { GlassCard } from "../glass/GlassCard";
import { NodeInput } from "./NodeInput";
import { CodeBlock } from "./CodeBlock";
import { ContextMenu } from "../ui/ContextMenu";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import { useToastStore } from "../../store/toastStore";
import { useCanvasStore } from "../../store/canvasStore";
import { useUIStore } from "../../store/uiStore";
import { useStreamMessage } from "../../hooks/useStreamMessage";
import { useSuggestionTendrils } from "../../hooks/useSuggestionTendrils";
import { useParallelDebate } from "../../hooks/useParallelDebate";
import { generateId } from "../../utils/layout";
import type { NodeData } from "../../types/canvas";

const LIGHT_THEMES = new Set(["sand", "snow", "sunrise"]);

function MessageNode({ id, data: rawData }: NodeProps) {
  const data = rawData as NodeData;
  const [showInput, setShowInput] = useState(false);
  const [illuminations, setIlluminations] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isNew, setIsNew] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  const [nodeWidth, setNodeWidth] = useState(data.width || 300);
  const [nodeHeight, setNodeHeight] = useState(data.height || 0);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(300);
  const startHeight = useRef(0);
  const currentWidth = useRef(nodeWidth);
  const currentHeight = useRef(nodeHeight);

  useEffect(() => {
    if (data.width) setNodeWidth(data.width);
  }, [data.width]);
  useEffect(() => {
    if (data.height) setNodeHeight(data.height);
  }, [data.height]);
  const illumIdRef = useRef(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  const contentBounds = useRef({ width: 2000, height: 2000 });

  const activeNodeId = useCanvasStore((s) => s.activeNodeId);
  const setActiveNode = useCanvasStore((s) => s.setActiveNode);
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const removeCascade = useCanvasStore((s) => s.removeCascade);
  const toggleCollapse = useCanvasStore((s) => s.toggleCollapse);
  const getChildCount = useCanvasStore((s) => s.getChildCount);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const undo = useCanvasStore((s) => s.undo);
  const addToast = useToastStore((s) => s.addToast);
  const { classifyAndStream } = useStreamMessage();
  const { materializeTendril } = useSuggestionTendrils();
  const { debateFrom } = useParallelDebate();

  const searchQuery = useUIStore((s) => s.searchQuery);
  const theme = useUIStore((s) => s.theme);
  const isActive = activeNodeId === id;
  const isError = data.label.includes("⚠ Error — click to retry");
  const isStopped = data.label === "[Stopped]";
  const childCount = getChildCount(id);
  const isBookmarked = useCanvasStore((s) => s.bookmarkedIds.has(id));
  const toggleBookmark = useCanvasStore((s) => s.toggleBookmark);
  const isSuggestion = data.nodeType === "suggestion";
  const isDistillation = data.nodeType === "distillation";
  const confidence = data.confidence;
  const isPruned = data.pruned ?? false;
  const pruneScore = data.pruneScore;
  const [prefilledText, setPrefilledText] = useState("");

  const isSearchMatch = useMemo(() => {
    if (isSuggestion) return false;
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    if (data.label.toLowerCase().includes(q)) return true;
    return data.messages.some((m) => m.content.toLowerCase().includes(q));
  }, [searchQuery, data.label, data.messages, isSuggestion]);

  const mdComponents: Components = useMemo(() => ({
    code: ({ className, children, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code
            style={{
              background: "var(--glass-hover)", padding: "1px 5px", borderRadius: 4,
              fontSize: "0.9em", color: "var(--accent)",
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={{ color: "var(--accent)", textDecoration: "underline" }}>
        {children}
      </a>
    ),
    p: ({ children }) => <div style={{ marginBottom: 4 }}>{children}</div>,
  }), []);

  useEffect(() => {
    currentWidth.current = nodeWidth;
  }, [nodeWidth]);
  useEffect(() => {
    currentHeight.current = nodeHeight;
  }, [nodeHeight]);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setIsNew(false), 500);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (!el || data.messages.length === 0) return;
    const origWS = el.style.whiteSpace;
    const origW = el.style.width;
    el.style.whiteSpace = 'nowrap';
    el.style.width = '';
    const nw = el.scrollWidth;
    el.style.whiteSpace = origWS;
    el.style.width = `${nw}px`;
    el.style.whiteSpace = 'normal';
    const nh = el.scrollHeight;
    el.style.width = origW;
    el.style.whiteSpace = origWS;
    contentBounds.current = {
      width: Math.max(data.width || 300, nw + 32),
      height: Math.max(data.height || 70, nh + 28),
    };
  }, [data.messages, data.width, data.height]);

  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveNode(id);
      if (isSuggestion && data.suggestionText) {
        materializeTendril(id);
        setPrefilledText(data.suggestionText);
      }
      setShowInput(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rid = illumIdRef.current++;
      setIlluminations((prev) => [...prev.slice(-3), { x, y, id: rid }]);
      setTimeout(() => {
        setIlluminations((prev) => prev.filter((r) => r.id !== rid));
      }, 800);
    },
    [id, setActiveNode, isSuggestion, data.suggestionText, materializeTendril]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleDelete = useCallback(() => {
    const count = useCanvasStore.getState().getDescendantIds(id).length + 1;
    if (count > 1) {
      setShowConfirm(true);
    } else {
      removeCascade(id);
      addToast(`Deleted`, "info");
    }
  }, [id, removeCascade, addToast]);

  const handleConfirmDelete = useCallback(() => {
    const count = useCanvasStore.getState().getDescendantIds(id).length;
    removeCascade(id);
    setShowConfirm(false);
    addToast(`Deleted${count > 0 ? ` + ${count} children` : ""}`, "info");
  }, [id, removeCascade, addToast]);

  const handleSend = useCallback(
    async (text: string) => {
      setShowInput(false);
      setPrefilledText("");
      const parentNode = useCanvasStore.getState().getNodeById(id);
      if (!parentNode) return;
      const parentPos = parentNode.position;
      const existingChildren = useCanvasStore.getState().edges.filter((e) => e.source === id).length;

      const angleStep = (Math.PI * 2) / 6;
      const angle = existingChildren * angleStep - Math.PI / 2;
      const aiDist = 360;

      const userPos = {
        x: parentPos.x + Math.cos(angle) * 200,
        y: parentPos.y + Math.sin(angle) * 200,
      };

      const aiPos = {
        x: userPos.x + Math.cos(angle) * aiDist,
        y: userPos.y + Math.sin(angle) * aiDist,
      };

      const userMsgId = generateId();
      if (isSuggestion) {
        addNode({
          id: userMsgId, type: "messageNode", position: userPos,
          data: {
            id: userMsgId, label: text,
            messages: [{ id: generateId(), role: "user", content: text, timestamp: Date.now() }],
            isActive: false, isTyping: false, nodeType: "branch",
          },
        });
      } else {
        addNode({
          id: userMsgId, type: "messageNode", position: userPos,
          data: {
            id: userMsgId, label: text,
            messages: [{ id: generateId(), role: "user", content: text, timestamp: Date.now() }],
            isActive: false, isTyping: false, nodeType: "branch",
          },
        });
      }
      addEdge({ id: `e-${id}-${userMsgId}`, source: id, target: userMsgId, type: "liquidEdge" });
      setActiveNode(userMsgId);

      const currentModel = useUIStore.getState().model;
      const aiNodeId = generateId();
      addNode({
        id: aiNodeId, type: "messageNode", position: aiPos,
        data: {
          id: aiNodeId, label: "",
          messages: [{ id: generateId(), role: "assistant", content: "", timestamp: Date.now() }],
          isActive: false, isTyping: true, nodeType: "response",
        },
      });
      addEdge({ id: `e-${userMsgId}-${aiNodeId}`, source: userMsgId, target: aiNodeId, type: "liquidEdge" });
      await classifyAndStream(text, aiNodeId, currentModel);
    },
    [id, addNode, addEdge, setActiveNode, classifyAndStream, isSuggestion]
  );

  const handleDebate = useCallback(
    async (text: string) => {
      setShowInput(false);
      setPrefilledText("");
      debateFrom(text, id);
    },
    [id, debateFrom]
  );

  const handleRetry = useCallback(() => {
    const parentNode = useCanvasStore.getState().getNodeById(id);
    if (!parentNode) return;
    const currentModel = useUIStore.getState().model;
    const aiNodeId = generateId();
    const aiPos = { x: parentNode.position.x + 200, y: parentNode.position.y + 300 };

    addNode({
      id: aiNodeId, type: "messageNode", position: aiPos,
      data: {
        id: aiNodeId, label: "",
        messages: [{ id: generateId(), role: "assistant", content: "", timestamp: Date.now() }],
        isActive: false, isTyping: true, nodeType: "response",
      },
    });
    addEdge({ id: `e-${id}-${aiNodeId}`, source: id, target: aiNodeId, type: "liquidEdge" });
    classifyAndStream(data.label.replace("⚠ Error — click to retry", "").trim() || "Retry", aiNodeId, currentModel);
  }, [id, addNode, addEdge, classifyAndStream, data.label]);

  const showUserIndicator = data.messages.length > 1 &&
    data.messages[data.messages.length - 1]?.role === "user";

  const resizeListeners = useRef<{ move: (ev: PointerEvent) => void; up: () => void } | null>(null);

  useEffect(() => {
    return () => {
      if (resizeListeners.current) {
        window.removeEventListener("pointermove", resizeListeners.current.move);
        window.removeEventListener("pointerup", resizeListeners.current.up);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, []);

  const handleResizePointerDown = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.nativeEvent as Event).stopImmediatePropagation();
    resizing.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startWidth.current = currentWidth.current;
    startHeight.current = currentHeight.current;
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (ev: PointerEvent) => {
      if (!resizing.current) return;
      const dx = ev.clientX - startX.current;
      const dy = ev.clientY - startY.current;
      const newWidth = Math.min(Math.max(100, startWidth.current + dx), contentBounds.current.width);
      const newHeight = Math.min(Math.max(60, startHeight.current + dy), contentBounds.current.height);
      currentWidth.current = newWidth;
      currentHeight.current = newHeight;
      setNodeWidth(newWidth);
      setNodeHeight(newHeight);
    };

    const onPointerUp = () => {
      resizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      useCanvasStore.getState().updateNode(id, {
        width: currentWidth.current,
        height: currentHeight.current,
      });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      resizeListeners.current = null;
    };

    resizeListeners.current = { move: onPointerMove, up: onPointerUp };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [id]);

  return (
    <motion.div
      onClick={handleNodeClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowDeleteBtn(true)}
      onMouseLeave={() => setShowDeleteBtn(false)}
      initial={isNew ? { scale: 0.6, opacity: 0, y: -20 } : false}
      animate={isNew ? { scale: 1, opacity: 1, y: 0 } : { opacity: isPruned ? 0.2 : (isSuggestion ? 0.45 : 1) }}
      whileHover={isSuggestion ? { opacity: 0.85 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
      style={{
        cursor: "pointer", width: nodeWidth, position: "relative", borderRadius: 20,
        filter: isPruned ? "saturate(0)" : (isSuggestion ? "saturate(0.5)" : "none"),
        transition: "filter 0.3s",
      }}
    >
      {childCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
          aria-label={data.collapsed ? "Expand" : "Collapse"}
          style={{
            position: "absolute", top: -10, left: -10, zIndex: 10,
            width: 24, height: 24, borderRadius: "50%", fontSize: 10,
            background: data.collapsed ? "rgba(60,180,255,0.25)" : "var(--glass-hover)",
            border: data.collapsed ? "1px solid rgba(60,180,255,0.4)" : "1px solid var(--glass-border)",
            color: data.collapsed ? "#6af" : "var(--text-muted)",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontWeight: 600, backdropFilter: "blur(10px)",
          }}
        >
          {data.collapsed ? `+${childCount}` : "▾"}
        </motion.button>
      )}

      {!isSuggestion && showDeleteBtn && !data.isTyping && data.nodeType !== "root" && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          aria-label="Delete node"
          style={{
            position: "absolute", top: -10, right: -10, zIndex: 10,
            width: 24, height: 24, borderRadius: "50%", fontSize: 10,
            background: "rgba(255,60,60,0.2)", border: "1px solid rgba(255,60,60,0.3)",
            color: "#f56", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          ✕
        </motion.button>
      )}

      {!isSuggestion && (
      <motion.button
        onClick={(e) => { e.stopPropagation(); toggleBookmark(id); }}
        aria-label={isBookmarked ? "Unbookmark" : "Bookmark"}
        style={{
          position: "absolute", top: -10, left: 22, zIndex: 10,
          width: 24, height: 24, borderRadius: "50%", fontSize: 11,
          background: isBookmarked ? "rgba(255,200,60,0.25)" : "var(--glass-hover)",
          border: isBookmarked ? "1px solid rgba(255,200,60,0.4)" : "1px solid var(--glass-border)",
          color: isBookmarked ? "#fd0" : "var(--text-muted)",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(10px)", lineHeight: 1,
        }}
      >
        {isBookmarked ? "★" : "☆"}
      </motion.button>
      )}

      <GlassCard
        noAnimation
        className={`rounded-[48px] ${isActive ? "active-pulse" : ""} ${isSearchMatch ? "search-match" : ""}`}
        tint={isDistillation ? "hsla(45, 90%, 60%, 0.1)" : (pruneScore !== undefined && pruneScore >= 70 ? "hsla(140, 60%, 55%, 0.10)" : (confidence !== undefined ? (
          confidence >= 75 ? "hsla(210, 80%, 65%, 0.12)" :
          confidence >= 50 ? "hsla(45, 80%, 65%, 0.10)" :
          confidence >= 25 ? "hsla(25, 80%, 65%, 0.13)" :
          "hsla(0, 75%, 65%, 0.14)"
        ) : undefined))}
        lens={{
          width: nodeWidth,
          height: nodeHeight > 0 ? nodeHeight : contentBounds.current.height,
          radius: 20,
          bezelWidth: 8,
          glassThickness: 30,
          refractiveIndex: 1.5,
          scale: 1,
          surface: "convex_squircle",
          squirclePower: 4,
          variant: "regular",
          interactive: false,
          tint: "auto",
        }}
        style={{
          width: nodeWidth,
          height: nodeHeight > 0 ? nodeHeight : undefined,
          minHeight: showInput ? 100 : 70,
          borderRadius: 20,
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: isDistillation
            ? "0 0 0 2px hsla(45, 90%, 65%, 0.5), 0 8px 40px hsla(45, 60%, 50%, 0.15)"
            : isActive
            ? "0 8px 40px hsla(220, 50%, 70%, 0.1), 0 0 80px hsla(220, 50%, 70%, 0.05)"
            : undefined,
          display: "flex",
          flexDirection: "column",
        } as React.CSSProperties}
      >
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

        {illuminations.map((r) => (
          <motion.span
            key={r.id}
            initial={{ width: 0, height: 0, opacity: 0.5, x: r.x, y: r.y }}
            animate={{ width: 160, height: 160, opacity: 0, x: r.x - 80, y: r.y - 80 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="glass-illumination"
          />
        ))}

        {/* Status badge */}
        <div style={{ position: "absolute", top: 10, right: 14, zIndex: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: data.isTyping ? "hsla(140,60%,60%,0.8)" : "var(--text-muted)",
          }} />
          {data.isTyping && (
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>typing</span>
          )}
          {confidence !== undefined && !data.isTyping && (
            <span style={{ fontSize: 9, color: "var(--text-muted)", opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
              {confidence}%
            </span>
          )}
        </div>

        {/* Messages */}
        <div ref={messagesRef} style={{
          padding: "14px 16px", position: "relative", zIndex: 1,
          flex: 1, overflowY: nodeHeight > 0 ? "auto" : undefined,
        }}>
          {isSuggestion && data.messages.length === 0 && data.label && (
            <div style={{ padding: "10px 0", fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)", fontStyle: "italic" }}>
              {data.label}
            </div>
          )}

          {data.messages.length === 0 && data.isTyping && (
            <div style={{ display: "flex", gap: 5, padding: "12px 0" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--text-muted)",
                  animation: `typingBounce 1.3s ${i * 0.14}s infinite`,
                }} />
              ))}
            </div>
          )}

          {data.messages.map((msg, i) => (
            <div key={msg.id} style={{ marginBottom: 8 }}>
              {msg.role === "user" && i === data.messages.length - 1 && (
                <div style={{
                  fontSize: 9, fontWeight: 600, color: "var(--text-muted)",
                  letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4,
                }}>
                  You
                </div>
              )}
              {msg.role === "assistant" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, marginBottom: 3,
                }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 4,
                    background: isDistillation
                      ? "linear-gradient(135deg, hsla(45,90%,65%,0.8), hsla(45,60%,50%,0.4))"
                      : "linear-gradient(135deg, var(--accent), rgba(100,180,255,0.5))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 7, color: "#fff", fontWeight: 700, flexShrink: 0,
                  }}>{isDistillation ? "✦" : "AI"}</span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 500 }}>
                    {isDistillation ? "Synthesis" : (data.modelLabel || "Mistral")}
                  </span>
                </div>
              )}
              <div style={{
                fontSize: 13.5, lineHeight: 1.65,
                color: msg.role === "user" ? "var(--text)" : "var(--text-secondary)",
                paddingLeft: msg.role === "assistant" ? 16 : 0,
              }}>
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {isError && (
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                style={{
                  fontSize: 11, padding: "6px 14px", borderRadius: 8,
                  background: "var(--accent-alpha)", border: "1px solid var(--accent)",
                  color: "var(--accent)", cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
              >
                ↻ Retry
              </button>
            </div>
          )}

          {isStopped && (
            <div style={{
              fontSize: 11, color: "var(--text-muted)", textAlign: "center",
              padding: "6px 0", fontStyle: "italic",
            }}>
              Stopped
            </div>
          )}
        </div>

        {/* Input — no divider, blends with glass */}
        {showInput && (
          <div style={{ padding: "0 14px 12px" }}>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              <NodeInput
                key={prefilledText || "input-" + id}
                onSend={handleSend}
                onDebate={handleDebate}
                initialValue={prefilledText}
              />
            </motion.div>
          </div>
        )}
      </GlassCard>

      {/* Resize handle */}
      <div
        onPointerDown={handleResizePointerDown}
        style={{
          position: "absolute",
          bottom: -4,
          right: -4,
          width: 32,
          height: 32,
          cursor: "nwse-resize",
          zIndex: 20,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: 2,
          touchAction: "none",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path
            d="M18 2C18 10.837 10.837 18 2 18"
            stroke={LIGHT_THEMES.has(theme) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <ContextMenu
        open={!!contextMenu}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={() => setContextMenu(null)}
        items={[
          { label: isBookmarked ? "Unbookmark" : "Bookmark", icon: isBookmarked ? "★" : "☆", action: () => toggleBookmark(id) },
          ...(childCount > 0
            ? [{ label: data.collapsed ? "Expand" : "Collapse", icon: data.collapsed ? "+" : "▾", action: () => toggleCollapse(id) }]
            : []),
          { label: "Auto arrange", icon: "⊞", action: () => autoLayout() },
          ...(data.nodeType !== "root"
            ? [{ label: "Delete node", icon: "✕", shortcut: "Del", action: handleDelete, destructive: true }]
            : []),
          { label: "Undo position", icon: "↩", shortcut: "⌘Z", action: () => undo() },
        ]}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete node and children?"
        message={`Delete this node and all ${useCanvasStore.getState().getDescendantIds(id).length} child nodes? This cannot be undone.`}
        confirmLabel="Delete all"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
        destructive
      />
    </motion.div>
  );
}

function areEqual(prev: NodeProps, next: NodeProps) {
  const prevData = prev.data as NodeData;
  const nextData = next.data as NodeData;
  if (prev.id !== next.id || prev.selected !== next.selected ||
      prev.dragging !== next.dragging || prev.type !== next.type) return false;
  if (prevData.label !== nextData.label || prevData.isActive !== nextData.isActive ||
      prevData.isTyping !== nextData.isTyping || prevData.collapsed !== nextData.collapsed ||
      prevData.nodeType !== nextData.nodeType || prevData.width !== nextData.width ||
      prevData.height !== nextData.height) return false;
  if ((prevData.confidence ?? null) !== (nextData.confidence ?? null)) return false;
  if ((prevData.pruned ?? false) !== (nextData.pruned ?? false)) return false;
  if ((prevData.pruneScore ?? null) !== (nextData.pruneScore ?? null)) return false;
  if (prevData.suggestionText !== nextData.suggestionText) return false;
  if (prevData.modelLabel !== nextData.modelLabel) return false;
  if (prevData.debateModel !== nextData.debateModel) return false;
  if (prevData.bookmarked !== nextData.bookmarked) return false;
  if (prevData.messages.length !== nextData.messages.length) return false;
  for (let i = 0; i < prevData.messages.length; i++) {
    if (prevData.messages[i].content !== nextData.messages[i].content) return false;
  }
  return true;
}

export default memo(MessageNode, areEqual);
