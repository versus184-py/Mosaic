import type { ProviderConfig } from "../types/canvas";

const API_KEY_KEY = "mosaic-api-key-enc";

const STORAGE_KEY = new Uint8Array([0x4D, 0x6F, 0x73, 0x61, 0x69, 0x63, 0x4B, 0x65, 0x79, 0x53, 0x61, 0x6C, 0x74]);

function xorEncrypt(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ STORAGE_KEY[i % STORAGE_KEY.length];
  }
  return btoa(String.fromCharCode(...result));
}

function xorDecrypt(encoded: string): string {
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ STORAGE_KEY[i % STORAGE_KEY.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return "";
  }
}

let cachedKey: string | null = null;

function getApiKey(): string {
  if (cachedKey !== null) return cachedKey;
  try {
    const stored = localStorage.getItem(API_KEY_KEY);
    if (!stored) return "";
    cachedKey = xorDecrypt(stored);
    return cachedKey;
  } catch {
    return "";
  }
}

export function setApiKey(key: string) {
  cachedKey = key;
  try {
    if (!key) {
      localStorage.removeItem(API_KEY_KEY);
    } else {
      localStorage.setItem(API_KEY_KEY, xorEncrypt(key));
    }
  } catch { /* noop */ }
}

export function clearCachedApiKey() {
  cachedKey = null;
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

// When adding providers (OpenAI, Anthropic), add a `provider` field:
// Record<string, { label: string; vision: boolean; provider: "mistral" | "openai" | "anthropic" }>
export const MODEL_MAP: Record<string, { label: string; vision: boolean }> = {
  "mistral-large-latest": { label: "Mistral Large", vision: false },
  "mistral-small-latest": { label: "Mistral Small", vision: false },
};
