import { createContext, useContext, useRef, useState, useEffect, useMemo } from "react";
import type { LensParams } from "../../liquid-glass/types";
import { createGridBackgroundNode } from "../../liquid-glass/capture";

interface GlassGroupContextValue {
  backdropKey: number;
  sharedBackdrop: React.ReactNode;
}

const GlassGroupContext = createContext<GlassGroupContextValue | null>(null);

export function useGlassGroup(): GlassGroupContextValue | null {
  return useContext(GlassGroupContext);
}

interface GlassEffectContainerProps {
  children: React.ReactNode;
  width: number;
  height: number;
}

export function GlassEffectContainer({ children, width, height }: GlassEffectContainerProps) {
  const [backdropKey, setBackdropKey] = useState(0);
  const sharedBackdrop = useMemo(
    () => createGridBackgroundNode(width, height),
    [width, height]
  );

  useEffect(() => {
    setBackdropKey((k) => k + 1);
  }, [width, height]);

  return (
    <GlassGroupContext.Provider value={{ backdropKey, sharedBackdrop }}>
      <div style={{ position: "relative", width, height, overflow: "hidden" }}>
        {children}
      </div>
    </GlassGroupContext.Provider>
  );
}
