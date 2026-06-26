import type { LensParams, DisplacementMap, SpecularMap } from "./types";
import { computeProfile, generateDisplacementMap, type DisplacementProfile } from "./displacement";
import { generateSpecularMap } from "./specular";
import { buildFilter, type FilterAPI } from "./filter";

export interface LensResources {
  profile: DisplacementProfile;
  dispMap: DisplacementMap;
  specMap: SpecularMap;
  filter: FilterAPI;
}

export function createLensResources(params: LensParams): LensResources {
  const profile = computeProfile(params);
  const dispMap = generateDisplacementMap(params, profile);
  const specMap = generateSpecularMap(params, profile);
  const filter = buildFilter(dispMap, specMap);
  document.body.appendChild(filter.svgElement);
  return { profile, dispMap, specMap, filter };
}

export function destroyLensResources(resources: LensResources): void {
  if (document.body.contains(resources.filter.svgElement)) {
    document.body.removeChild(resources.filter.svgElement);
  }
}

export function isNativeRefractionSupported(): boolean {
  return false;
}

export function getFilterUrl(filterId: string): string {
  return `url(#${filterId})`;
}
