import { GlassCard } from "../glass/GlassCard";
import { FluidSlider } from "../glass/FluidSlider";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function ZoomControls({ zoom, onZoomChange }: ZoomControlsProps) {
  return (
    <GlassCard
      className="rounded-[999px]"
      style={{
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        borderRadius: 20,
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 32 }}>
        {Math.round(zoom * 100)}%
      </span>
      <div style={{ width: 100 }}>
        <FluidSlider
          min={0.1}
          max={2}
          step={0.01}
          value={zoom}
          onChange={onZoomChange}
        />
      </div>
    </GlassCard>
  );
}
