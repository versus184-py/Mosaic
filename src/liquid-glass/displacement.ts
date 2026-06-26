import type { LensParams, DisplacementMap, InteractiveState } from "./types";
import { computeRayDisplacement } from "./refraction";

function maxRadius(theta: number, w: number, h: number, r: number): number {
  const hw = w / 2;
  const hh = h / 2;
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const eps = 1e-10;
  let maxR = Infinity;

  if (Math.abs(ct) > eps) {
    const d = (ct > 0 ? hw : -hw) / ct;
    if (d > 0 && Math.abs(d * st) <= hh + eps) maxR = Math.min(maxR, d);
  }
  if (Math.abs(st) > eps) {
    const d = (st > 0 ? hh : -hh) / st;
    if (d > 0 && Math.abs(d * ct) <= hw + eps) maxR = Math.min(maxR, d);
  }

  const cr = Math.min(r, Math.min(hw, hh));
  const corners = [
    { cx: hw - cr, cy: hh - cr },
    { cx: -(hw - cr), cy: hh - cr },
    { cx: -(hw - cr), cy: -(hh - cr) },
    { cx: hw - cr, cy: -(hh - cr) },
  ];

  for (const { cx, cy } of corners) {
    const A = 1;
    const B = 2 * (ct * cx + st * cy);
    const C = cx * cx + cy * cy - cr * cr;
    const disc = B * B - 4 * A * C;
    if (disc >= 0) {
      const sqrtDisc = Math.sqrt(disc);
      for (const d of [(-B + sqrtDisc) / 2, (-B - sqrtDisc) / 2]) {
        if (d > 0) {
          const ix = d * ct - cx;
          const iy = d * st - cy;
          if (Math.abs(Math.sqrt(ix * ix + iy * iy) - cr) < 0.5 && ix * iy >= 0) {
            maxR = Math.min(maxR, d);
          }
        }
      }
    }
  }

  return maxR === Infinity ? Math.min(hw, hh) : maxR;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export interface DisplacementProfile {
  samples: Float64Array;
  maxDisp: number;
  count: number;
}

export function computeProfile(params: LensParams, sampleCount = 128): DisplacementProfile {
  const samples = new Float64Array(sampleCount);
  let maxDisp = 0;
  for (let i = 0; i < sampleCount; i++) {
    const r = (i + 0.5) / sampleCount;
    const d = computeRayDisplacement(r, params);
    samples[i] = d;
    if (Math.abs(d) > maxDisp) maxDisp = Math.abs(d);
  }
  return { samples, maxDisp, count: sampleCount };
}

export function sampleDisplacement(normR: number, profile: DisplacementProfile): number {
  if (normR >= 1) return 0;
  const idx = normR * profile.count;
  const i0 = Math.min(Math.floor(idx), profile.count - 1);
  const i1 = Math.min(i0 + 1, profile.count - 1);
  const frac = idx - i0;
  return profile.samples[i0] * (1 - frac) + profile.samples[i1] * frac;
}

export function generateDisplacementMap(
  params: LensParams,
  profile: DisplacementProfile,
  interactive?: InteractiveState
): DisplacementMap {
  const { width, height, radius: cornerRadius, scale } = params;
  const mapW = Math.min(Math.ceil(width), 512);
  const mapH = Math.min(Math.ceil(height), 512);

  const canvas = document.createElement("canvas");
  canvas.width = mapW;
  canvas.height = mapH;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(mapW, mapH);
  const data = imageData.data;

  const intStrength = interactive?.active ? 40 : 0;

  for (let py = 0; py < mapH; py++) {
    for (let px = 0; px < mapW; px++) {
      const x = (px / mapW) * width - width / 2;
      const y = (py / mapH) * height - height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x);
      const maxR = maxRadius(theta, width, height, cornerRadius);
      const normR = maxR > 0 ? dist / maxR : 0;

      let dispX = 0;
      let dispY = 0;
      if (normR < 1 && dist > 0) {
        const disp = sampleDisplacement(normR, profile) * scale;
        dispX = disp * x / dist;
        dispY = disp * y / dist;
      }

      if (intStrength > 0 && interactive) {
        const ix = (interactive.x / width) * mapW - px;
        const iy = (interactive.y / height) * mapH - py;
        const iDist = Math.sqrt(ix * ix + iy * iy);
        const iMax = Math.min(mapW, mapH) * 0.15;
        if (iDist < iMax && iDist > 0) {
          const falloff = 1 - iDist / iMax;
          const warp = intStrength * falloff * falloff;
          dispX += warp * ix / iDist;
          dispY += warp * iy / iDist;
        }
      }

      const idx = (py * mapW + px) * 4;
      data[idx] = clamp(128 + dispX);
      data[idx + 1] = clamp(128 + dispY);
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL();

  return { dataUrl, width: mapW, height: mapH, maxDisplacement: profile.maxDisp * scale };
}
