import type { SurfaceProfile, LensParams } from "./types";

export function surfaceHeight(r: number, params: LensParams): number {
  const { bezelWidth, surface, squirclePower = 2 } = params;
  const p = Math.max(0.5, squirclePower);

  switch (surface) {
    case "convex_squircle":
      return r <= 1 ? bezelWidth * Math.pow(1 - Math.pow(r, p), 1 / p) : 0;
    case "convex_circle":
      return r <= 1 ? bezelWidth * Math.sqrt(Math.max(0, 1 - r * r)) : 0;
    case "concave":
      return r <= 1 ? bezelWidth * (1 - Math.pow(1 - Math.pow(r, p), 1 / p)) : 0;
    case "lip":
      return r <= 1 ? bezelWidth * Math.pow(r, p) * Math.pow(1 - r, p) * Math.pow(4, p) : 0;
  }
}

export function surfaceDerivative(r: number, params: LensParams): number {
  const { bezelWidth, surface, squirclePower = 2 } = params;
  const p = Math.max(0.5, squirclePower);
  const eps = 1e-6;
  const rClamped = Math.max(eps, Math.min(1 - eps, r));

  switch (surface) {
    case "convex_squircle": {
      const term = 1 - Math.pow(rClamped, p);
      if (term <= 0) return 0;
      return -bezelWidth * Math.pow(term, 1 / p - 1) * Math.pow(rClamped, p - 1);
    }
    case "convex_circle": {
      if (rClamped >= 1) return 0;
      return -bezelWidth * rClamped / Math.sqrt(Math.max(eps, 1 - rClamped * rClamped));
    }
    case "concave": {
      const inner = 1 - Math.pow(rClamped, p);
      if (inner <= 0) return 0;
      return bezelWidth * Math.pow(inner, 1 / p - 1) * Math.pow(rClamped, p - 1);
    }
    case "lip": {
      const pow4 = Math.pow(4, p);
      return bezelWidth * pow4 * (
        p * Math.pow(rClamped, p - 1) * Math.pow(1 - rClamped, p) -
        p * Math.pow(rClamped, p) * Math.pow(1 - rClamped, p - 1)
      );
    }
  }
}

export function computeRayDisplacement(r: number, params: LensParams): number {
  const { glassThickness, refractiveIndex } = params;
  const n = Math.max(1.01, refractiveIndex);
  const dh = surfaceDerivative(r, params);
  const alpha = Math.atan(Math.abs(dh));
  const sinBeta = Math.sin(alpha) / n;
  if (sinBeta >= 1) return 0;
  const beta = Math.asin(sinBeta);
  const deflection = alpha - beta;
  const sign = dh > 0 ? -1 : 1;
  return sign * glassThickness * Math.tan(deflection);
}

export function interactiveWarpDisplacement(
  px: number,
  py: number,
  touchX: number,
  touchY: number,
  width: number,
  height: number,
  radius: number,
  strength: number
): { dx: number; dy: number } {
  const dx = px - touchX;
  const dy = py - touchY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.min(width, height) * 0.3;
  if (dist > maxDist || dist < 0.5) return { dx: 0, dy: 0 };

  const falloff = 1 - dist / maxDist;
  const warp = strength * falloff * falloff;

  const angle = Math.atan2(dy, dx);
  return {
    dx: Math.cos(angle) * warp,
    dy: Math.sin(angle) * warp,
  };
}
