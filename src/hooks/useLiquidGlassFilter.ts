import { useRef, useEffect, useCallback, useState } from "react";

let filterCounter = 0;

const SVG_NS = "http://www.w3.org/2000/svg";

interface LiquidGlassAPI {
  filterId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  isSupported: boolean;
}

function supportsSvgFilters(): boolean {
  if (typeof document === "undefined") return false;
  const test = document.createElement("div");
  return "filter" in test.style;
}

export function useLiquidGlassFilter(): LiquidGlassAPI {
  const id = useRef(`lg-${++filterCounter}`);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number>(0);
  const seedRef = useRef(Math.random() * 1000);
  const mouseRef = useRef({ x: 50, y: 50 });
  const lightRef = useRef({ x: 50, y: 50 });
  const prevTimeRef = useRef(0);
  const [isSupported] = useState(supportsSvgFilters);

  useEffect(() => {
    if (!isSupported) return;

    const filterId = id.current;

    // Create SVG element with the Apple-authentic filter pipeline
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("style", "position:absolute;width:0;height:0");
    svg.setAttribute("aria-hidden", "true");

    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", filterId);
    filter.setAttribute("x", "-20%");
    filter.setAttribute("y", "-20%");
    filter.setAttribute("width", "140%");
    filter.setAttribute("height", "140%");

    // feTurbulence - very subtle fractal noise for surface texture
    const turbulence = document.createElementNS(SVG_NS, "feTurbulence");
    turbulence.setAttribute("type", "fractalNoise");
    turbulence.setAttribute("baseFrequency", "0.008 0.008");
    turbulence.setAttribute("numOctaves", "1");
    turbulence.setAttribute("seed", String(Math.floor(seedRef.current)));
    turbulence.setAttribute("result", "noise");
    filter.appendChild(turbulence);

    // Soften the noise into a gentle heightmap
    const blurMap = document.createElementNS(SVG_NS, "feGaussianBlur");
    blurMap.setAttribute("in", "noise");
    blurMap.setAttribute("stdDeviation", "12");
    blurMap.setAttribute("result", "softMap");
    filter.appendChild(blurMap);

    // Very subtle specular lighting
    const specLight = document.createElementNS(SVG_NS, "feSpecularLighting");
    specLight.setAttribute("in", "noise");
    specLight.setAttribute("surfaceScale", "1");
    specLight.setAttribute("specularConstant", "0.15");
    specLight.setAttribute("specularExponent", "20");
    specLight.setAttribute("result", "specLight");
    const pointLight = document.createElementNS(SVG_NS, "fePointLight");
    pointLight.setAttribute("x", "50");
    pointLight.setAttribute("y", "50");
    pointLight.setAttribute("z", "500");
    specLight.appendChild(pointLight);
    filter.appendChild(specLight);

    // Gentle blur on source
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("stdDeviation", "0.5");
    blur.setAttribute("result", "blurred");
    filter.appendChild(blur);

    // Displacement map — very subtle surface warping
    const dispMap = document.createElementNS(SVG_NS, "feDisplacementMap");
    dispMap.setAttribute("in", "blurred");
    dispMap.setAttribute("in2", "softMap");
    dispMap.setAttribute("scale", "0.4");
    dispMap.setAttribute("xChannelSelector", "R");
    dispMap.setAttribute("yChannelSelector", "G");
    dispMap.setAttribute("result", "displaced");
    filter.appendChild(dispMap);

    // Blend specLight + displaced with soft-light for subtlety
    const blend = document.createElementNS(SVG_NS, "feBlend");
    blend.setAttribute("in", "displaced");
    blend.setAttribute("in2", "specLight");
    blend.setAttribute("mode", "normal");
    filter.appendChild(blend);

    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    // --- Continuous seed animation ---
    let running = true;

    function animate(time: number) {
      if (!running) return;
      if (time - prevTimeRef.current > 50) {
        seedRef.current += 0.008;
        const t = document.getElementById(filterId);
        if (t) {
          const turb = t.querySelector("feTurbulence");
          if (turb) turb.setAttribute("seed", String(Math.floor(seedRef.current)));

          // Lerp light position toward mouse
          const mx = mouseRef.current.x;
          const my = mouseRef.current.y;
          lightRef.current.x += (mx - lightRef.current.x) * 0.06;
          lightRef.current.y += (my - lightRef.current.y) * 0.06;
          const pl = t.querySelector("fePointLight");
          if (pl) {
            pl.setAttribute("x", String(lightRef.current.x));
            pl.setAttribute("y", String(lightRef.current.y));
          }
        }
        prevTimeRef.current = time;
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      if (document.body.contains(svg)) {
        document.body.removeChild(svg);
      }
    };
  }, [isSupported]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    mouseRef.current = { x, y };
  }, []);

  const onMouseLeave = useCallback(() => {
    mouseRef.current = { x: 50, y: 50 };
  }, []);

  return {
    filterId: id.current,
    containerRef,
    onMouseMove,
    onMouseLeave,
    isSupported,
  };
}
