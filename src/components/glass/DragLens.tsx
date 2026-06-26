import { useRef, useCallback, useState } from "react";
import { GlassCard } from "./GlassCard";

interface DragLensProps {
  initialX?: number;
  initialY?: number;
}

export function DragLens({ initialX = 200, initialY = 200 }: DragLensProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    offsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none", position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}
    >
      <GlassCard
        lens={{
          width: 120,
          height: 120,
          radius: 20,
          bezelWidth: 12,
          glassThickness: 80,
          refractiveIndex: 1.6,
          scale: 1.2,
          surface: "convex_squircle",
          squirclePower: 2.5,
        }}
        className="glass-lens-strong"
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: 120,
          height: 120,
          borderRadius: 24,
          padding: 0,
          cursor: dragging ? "grabbing" : "grab",
          pointerEvents: "auto",
          userSelect: "none",
          boxShadow: dragging
            ? "0 8px 40px var(--shadow), 0 0 0 2px var(--accent-alpha)"
            : "0 4px 20px var(--shadow)",
          transition: dragging ? "none" : "box-shadow 0.2s ease",
        }}
        noAnimation
        clickEffect={false}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Lens</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>
            {Math.round(pos.x)}, {Math.round(pos.y)}
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
