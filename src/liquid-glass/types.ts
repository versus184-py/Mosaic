export type SurfaceProfile = "convex_squircle" | "convex_circle" | "concave" | "lip";

export type GlassVariant = "regular" | "clear";

export interface LensParams {
  width: number;
  height: number;
  radius: number;
  bezelWidth: number;
  glassThickness: number;
  refractiveIndex: number;
  scale: number;
  surface: SurfaceProfile;
  squirclePower?: number;
  variant?: GlassVariant;
  interactive?: boolean;
  tint?: { r: number; g: number; b: number; a: number } | "auto";
}

export interface InteractiveState {
  active: boolean;
  x: number;
  y: number;
  pressure: number;
}

export interface DisplacementMap {
  dataUrl: string;
  width: number;
  height: number;
  maxDisplacement: number;
}

export interface SpecularMap {
  dataUrl: string;
  width: number;
  height: number;
}

export interface Orientation {
  pitch: number;
  roll: number;
}
