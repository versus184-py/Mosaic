import type { LensParams, SpecularMap, Orientation } from "./types";
import { sampleDisplacement, type DisplacementProfile } from "./displacement";

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function generateSpecularMap(
  params: LensParams,
  profile: DisplacementProfile,
  orientation?: Orientation
): SpecularMap {
  const { width, height, radius: cornerRadius, scale, variant } = params;
  const isClear = variant === "clear";
  const mapW = Math.min(Math.ceil(width), 512);
  const mapH = Math.min(Math.ceil(height), 512);

  const canvas = document.createElement("canvas");
  canvas.width = mapW;
  canvas.height = mapH;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(mapW, mapH);
  const data = imageData.data;

  const lightX = orientation
    ? 50 + orientation.pitch * 30
    : 50;
  const lightY = orientation
    ? 50 + orientation.roll * 30
    : 30;

  let maxGradient = 0;
  const gradients = new Float64Array(mapW * mapH);

  for (let py = 0; py < mapH; py++) {
    for (let px = 0; px < mapW; px++) {
      const x = (px / mapW) * width - width / 2;
      const y = (py / mapH) * height - height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x);
      const maxR = cornerRadius > 0
        ? (() => {
            const hw = width / 2;
            const hh = height / 2;
            const cr = Math.min(cornerRadius, Math.min(hw, hh));
            const ct = Math.cos(theta);
            const st = Math.sin(theta);
            const eps = 1e-10;
            let mR = Infinity;
            if (Math.abs(ct) > eps) {
              const d = (ct > 0 ? hw : -hw) / ct;
              if (d > 0 && Math.abs(d * st) <= hh + eps) mR = Math.min(mR, d);
            }
            if (Math.abs(st) > eps) {
              const d = (st > 0 ? hh : -hh) / st;
              if (d > 0 && Math.abs(d * ct) <= hw + eps) mR = Math.min(mR, d);
            }
            return mR === Infinity ? Math.min(hw, hh) : mR;
          })()
        : Math.min(width, height) / 2;

      const normR = maxR > 0 ? dist / maxR : 0;
      const idx = py * mapW + px;

      if (normR < 1 && dist > 0) {
        const prevR = Math.max(0, (dist - 0.5) / maxR);
        const nextR = Math.min(1, (dist + 0.5) / maxR);
        const dPrev = sampleDisplacement(prevR, profile) * scale;
        const dNext = sampleDisplacement(nextR, profile) * scale;
        const rawGrad = Math.abs(dNext - dPrev);
        const lx = (lightX - (px / mapW) * 100);
        const ly = (lightY - (py / mapH) * 100);
        const lDist = Math.sqrt(lx * lx + ly * ly);
        const lightFalloff = Math.max(0, 1 - lDist / 100);
        gradients[idx] = rawGrad * (0.5 + 0.5 * lightFalloff);
        if (gradients[idx] > maxGradient) maxGradient = gradients[idx];
      } else {
        gradients[idx] = 0;
      }
    }
  }

  const specIntensity = isClear ? 0.4 : 1;

  for (let py = 0; py < mapH; py++) {
    for (let px = 0; px < mapW; px++) {
      const idx = py * mapW + px;
      const raw = maxGradient > 0 ? gradients[idx] / maxGradient : 0;
      const bright = raw > 0.2 ? Math.min(1, (raw - 0.2) / 0.8) : 0;
      const val = clamp(bright * 255 * specIntensity);

      const di = idx * 4;
      data[di] = val;
      data[di + 1] = val;
      data[di + 2] = val;
      data[di + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { dataUrl: canvas.toDataURL(), width: mapW, height: mapH };
}
