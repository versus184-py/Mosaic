import { useRef, useCallback, useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { createSpring, tickSpring, type SpringState, type SpringParams } from "../../liquid-glass/spring";

const springIdleParams: SpringParams = { stiffness: 180, damping: 12, mass: 1 };
const springDragParams: SpringParams = { stiffness: 500, damping: 30, mass: 0.5 };

interface FluidSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function FluidSlider({ min, max, step, value, onChange, label }: FluidSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const params = dragging ? springDragParams : springIdleParams;
  const springRef = useRef<SpringState>(createSpring(value, params));
  const [springValue, setSpringValue] = useState(value);
  const rafRef = useRef<number>(0);

  const fractional = (springValue - min) / (max - min);

  const targetRef = useRef(value);

  const paramsRef = useRef(params);
  useEffect(() => {
    targetRef.current = value;
    if (params !== paramsRef.current) {
      paramsRef.current = params;
      springRef.current = createSpring(springRef.current.value, params);
    }
    if (!springRef.current) {
      springRef.current = createSpring(value, params);
    }
    let running = true;
    const animate = () => {
      if (!running) return;
      const tgt = targetRef.current;
      springRef.current = tickSpring(springRef.current, tgt, params, 0.016);
      setSpringValue(springRef.current.value);
      if (Math.abs(springRef.current.value - tgt) > 0.001 || dragging) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, dragging, params]);

  const updateValue = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const stepped = Math.round((min + frac * (max - min)) / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    onChange(clamped);
  }, [min, max, step, onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e);
  }, [updateValue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    updateValue(e);
  }, [dragging, updateValue]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      {label && (
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      )}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: "relative",
          height: 24,
          cursor: "pointer",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 4,
            transform: "translateY(-50%)",
            borderRadius: 2,
            background: "var(--glass-border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: `${fractional * 100}%`,
            height: 4,
            transform: "translateY(-50%)",
            borderRadius: 2,
            background: "var(--accent)",
            transition: dragging ? "none" : "width 0.12s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${fractional * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <GlassCard
            lens={{
              width: 28,
              height: 28,
              radius: 14,
              bezelWidth: 6,
              glassThickness: 40,
              refractiveIndex: 1.5,
              scale: 1,
              surface: "convex_squircle",
              squirclePower: 3,
              variant: "regular",
              interactive: dragging,
            }}
            className="glass-lens-subtle"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: dragging ? "grabbing" : "grab",
              boxShadow: dragging
                ? "0 0 0 3px var(--accent-alpha), 0 4px 16px var(--shadow)"
                : "0 2px 8px var(--shadow)",
              transition: "box-shadow 0.15s ease",
            }}
            noAnimation
          >
            <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>
              {Math.round(springValue)}
            </span>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
