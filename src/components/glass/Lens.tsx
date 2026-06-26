import { useEffect, useMemo, useRef, useLayoutEffect } from "react";
import type { LensParams, DisplacementMap } from "../../liquid-glass/types";
import { computeProfile, generateDisplacementMap } from "../../liquid-glass/displacement";
import type { FilterAPI } from "../../liquid-glass/filter";

const SVG_NS = "http://www.w3.org/2000/svg";
let counter = 0;
const SVG_PREFIX = "gl-lens-";

function buildMinimalFilter(dispMap: DisplacementMap): FilterAPI {
  const filterId = `${SVG_PREFIX}${++counter}`;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("style", "position:absolute;width:0;height:0");
  svg.setAttribute("aria-hidden", "true");

  const defs = document.createElementNS(SVG_NS, "defs");
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", filterId);
  filter.setAttribute("x", "0%");
  filter.setAttribute("y", "0%");
  filter.setAttribute("width", "100%");
  filter.setAttribute("height", "100%");

  const img = document.createElementNS(SVG_NS, "feImage");
  img.setAttribute("href", dispMap.dataUrl);
  img.setAttribute("result", "map");
  filter.appendChild(img);

  const displace = document.createElementNS(SVG_NS, "feDisplacementMap");
  displace.setAttribute("in", "SourceGraphic");
  displace.setAttribute("in2", "map");
  displace.setAttribute("scale", "255");
  displace.setAttribute("xChannelSelector", "R");
  displace.setAttribute("yChannelSelector", "G");
  filter.appendChild(displace);

  defs.appendChild(filter);
  svg.appendChild(defs);

  return {
    filterId,
    svgElement: svg,
    updateTouchMap: () => {},
    updateSpecMap: () => {},
  };
}

interface LensProps {
  children?: React.ReactNode;
  params: LensParams;
  className?: string;
  style?: React.CSSProperties;
  refractionTarget: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function Lens({
  children,
  params,
  className = "",
  style,
  refractionTarget,
  onClick,
  onContextMenu,
}: LensProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<FilterAPI | null>(null);
  const isClear = params.variant === "clear";

  const profile = useMemo(() => computeProfile(params), [
    params.bezelWidth, params.glassThickness, params.refractiveIndex,
    params.scale, params.surface, params.squirclePower,
  ]);

  const dispMap = useMemo<DisplacementMap>(
    () => generateDisplacementMap(params, profile),
    [profile, params.width, params.height, params.radius, params.scale]
  );

  const filterSpec = useMemo(
    () => buildMinimalFilter(dispMap),
    [dispMap.dataUrl]
  );

  useLayoutEffect(() => {
    if (document.body.contains(filterSpec.svgElement)) return;
    document.body.appendChild(filterSpec.svgElement);
    filterRef.current = filterSpec;
    return () => {
      if (document.body.contains(filterSpec.svgElement)) {
        document.body.removeChild(filterSpec.svgElement);
      }
      filterRef.current = null;
    };
  }, [filterSpec]);

  const filterUrl = `url(#${filterSpec.filterId})`;
  const tintStyle = params.tint && params.tint !== "auto"
    ? { background: `rgba(${params.tint.r},${params.tint.g},${params.tint.b},${isClear ? 0 : params.tint.a})` }
    : {};

  return (
    <div
      ref={containerRef}
      className={`glass-container ${isClear ? "glass-clear" : "glass-frosted"} ${className}`}
      style={{ ...style, ...tintStyle }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="glass-lens-clone" style={{ filter: filterUrl }}>
        {refractionTarget}
      </div>
      {!isClear && <div className="glass-tint-layer" />}
      <div className={`glass-shine-layer ${isClear ? "glass-shine-clear" : ""}`} />
      <div className="glass-content-layer">{children}</div>
    </div>
  );
}
