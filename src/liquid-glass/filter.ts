import type { DisplacementMap, SpecularMap } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

let counter = 0;

export interface FilterAPI {
  filterId: string;
  svgElement: SVGSVGElement;
  updateTouchMap: (dataUrl: string) => void;
  updateSpecMap: (dataUrl: string) => void;
}

export function buildFilter(
  dispMap: DisplacementMap,
  specMap: SpecularMap,
  interactive = false
): FilterAPI {
  const filterId = `gl-${++counter}`;

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

  const dispImage = document.createElementNS(SVG_NS, "feImage");
  dispImage.setAttribute("href", dispMap.dataUrl);
  dispImage.setAttribute("result", "dispMap");
  filter.appendChild(dispImage);

  const displace = document.createElementNS(SVG_NS, "feDisplacementMap");
  displace.setAttribute("in", "SourceGraphic");
  displace.setAttribute("in2", "dispMap");
  displace.setAttribute("scale", "255");
  displace.setAttribute("xChannelSelector", "R");
  displace.setAttribute("yChannelSelector", "G");
  displace.setAttribute("result", "displaced");
  filter.appendChild(displace);

  let currentInput = "displaced";
  let touchImage: SVGElement | null = null;

  if (interactive) {
    touchImage = document.createElementNS(SVG_NS, "feImage");
    touchImage.setAttribute("href", "");
    touchImage.setAttribute("result", "touchMap");
    filter.appendChild(touchImage);

    const touchWarp = document.createElementNS(SVG_NS, "feDisplacementMap");
    touchWarp.setAttribute("in", currentInput);
    touchWarp.setAttribute("in2", "touchMap");
    touchWarp.setAttribute("scale", "80");
    touchWarp.setAttribute("xChannelSelector", "R");
    touchWarp.setAttribute("yChannelSelector", "G");
    touchWarp.setAttribute("result", "warped");
    filter.appendChild(touchWarp);
    currentInput = "warped";
  }

  const specImage = document.createElementNS(SVG_NS, "feImage");
  specImage.setAttribute("href", specMap.dataUrl);
  specImage.setAttribute("result", "specMap");
  filter.appendChild(specImage);

  const blend = document.createElementNS(SVG_NS, "feBlend");
  blend.setAttribute("in", currentInput);
  blend.setAttribute("in2", "specMap");
  blend.setAttribute("mode", "screen");
  filter.appendChild(blend);

  defs.appendChild(filter);
  svg.appendChild(defs);

  const updateTouchMap = (dataUrl: string) => {
    if (touchImage) touchImage.setAttribute("href", dataUrl);
  };

  const updateSpecMap = (dataUrl: string) => {
    specImage.setAttribute("href", dataUrl);
  };

  return { filterId, svgElement: svg, updateTouchMap, updateSpecMap };
}
