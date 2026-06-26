import { useCallback, useRef, useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { createSpring, tickSpring, type SpringState, type SpringParams } from "../../liquid-glass/spring";

const springParams: SpringParams = { stiffness: 300, damping: 18, mass: 1 };

interface TactileSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function TactileSwitch({ checked, onChange, label }: TactileSwitchProps) {
  const springRef = useRef<SpringState>(createSpring(checked ? 1 : 0, springParams));
  const [springPos, setSpringPos] = useState(checked ? 1 : 0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const target = checked ? 1 : 0;
    springRef.current = createSpring(target, springParams);
    let running = true;
    const animate = () => {
      if (!running) return;
      springRef.current = tickSpring(springRef.current, target, springParams, 0.016);
      setSpringPos(springRef.current.value);
      if (Math.abs(springRef.current.value - target) > 0.001) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [checked]);

  const knobLeft = 3 + springPos * 24;

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
        cursor: "pointer",
      }}
      onClick={onChange}
    >
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <GlassCard
        lens={{
          width: 50,
          height: 26,
          radius: 13,
          bezelWidth: 4,
          glassThickness: 30,
          refractiveIndex: 1.5,
          scale: 0.8,
          surface: "convex_squircle",
          squirclePower: 2,
          variant: "regular",
          interactive: true,
        }}
        className="glass-lens-subtle"
        style={{
          width: 50,
          height: 26,
          borderRadius: 13,
          padding: 0,
          position: "relative",
          cursor: "pointer",
          background: checked ? "var(--accent)" : "var(--glass-border)",
          transition: "background 0.2s ease",
        }}
        noAnimation
        clickEffect={false}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 3,
            left: knobLeft,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        />
      </GlassCard>
    </label>
  );
}
