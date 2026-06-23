import type { ProviderConfig } from "../types/canvas";

const API_KEY_KEY = "mosaic-api-key";

function getApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_KEY) || "";
  } catch {
    return "";
  }
}

export function setApiKey(key: string) {
  try {
    localStorage.setItem(API_KEY_KEY, key);
  } catch { /* noop */ }
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function getProviderConfig(): ProviderConfig & { key: () => string } {
  return {
    url: "https://api.mistral.ai/v1/chat/completions",
    label: "Mistral",
    key: getApiKey,
  };
}

export const MODEL_MAP: Record<string, { label: string; vision: boolean }> = {
  "mistral-large-latest": { label: "Mistral Large", vision: false },
  "mistral-small-latest": { label: "Mistral Small", vision: false },
};
