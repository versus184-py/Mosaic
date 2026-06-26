import { Lens } from "./Lens";
import { createGridBackgroundNode } from "../../liquid-glass/capture";

interface Segment {
  id: string;
  label: string;
}

interface SegmentControlProps {
  segments: Segment[];
  activeId: string;
  onChange: (id: string) => void;
}

export function SegmentControl({ segments, activeId, onChange }: SegmentControlProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        position: "relative",
      }}
    >
      {segments.map((seg, i) => {
        const isActive = seg.id === activeId;
        return (
          <div
            key={seg.id}
            onClick={() => onChange(seg.id)}
            style={{
              position: "relative",
              padding: "4px 10px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              color: isActive ? "var(--text)" : "var(--text-muted)",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
              zIndex: isActive ? 2 : 1,
            }}
          >
            {isActive && (
              <Lens
                params={{
                  width: seg.label.length * 10 + 20,
                  height: 24,
                  radius: 6,
                  bezelWidth: 3,
                  glassThickness: 20,
                  refractiveIndex: 1.3,
                  scale: 0.6,
                  surface: "convex_squircle",
                  squirclePower: 2,
                }}
                refractionTarget={createGridBackgroundNode(seg.label.length * 10 + 20, 24)}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  border: "1px solid var(--glass-border)",
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{seg.label}</span>
          </div>
        );
      })}
    </div>
  );
}
