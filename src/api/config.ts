import type { ProviderId, ModelOption } from "../types/canvas";

const STORAGE_SALT = new Uint8Array([0x4D, 0x6F, 0x73, 0x61, 0x69, 0x63, 0x4B, 0x65, 0x79, 0x53, 0x61, 0x6C, 0x74]);

function xorEncrypt(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ STORAGE_SALT[i % STORAGE_SALT.length];
  }
  return btoa(String.fromCharCode(...result));
}

function xorDecrypt(encoded: string): string {
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ STORAGE_SALT[i % STORAGE_SALT.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return "";
  }
}

const keyCache = new Map<ProviderId, string | null>();

function storageKey(provider: ProviderId): string {
  return `mosaic-api-key-${provider}`;
}

export function setApiKey(provider: ProviderId, key: string) {
  keyCache.set(provider, key);
  try {
    if (!key) {
      localStorage.removeItem(storageKey(provider));
    } else {
      localStorage.setItem(storageKey(provider), xorEncrypt(key));
    }
  } catch { /* noop */ }
}

export function getApiKey(provider: ProviderId): string {
  if (keyCache.has(provider)) return keyCache.get(provider) ?? "";
  try {
    const stored = localStorage.getItem(storageKey(provider));
    if (!stored) return "";
    const decrypted = xorDecrypt(stored);
    keyCache.set(provider, decrypted);
    return decrypted;
  } catch {
    return "";
  }
}

export function hasApiKey(provider: ProviderId): boolean {
  return !!getApiKey(provider);
}

export function clearCachedApiKey(provider?: ProviderId) {
  if (provider) {
    keyCache.delete(provider);
  } else {
    keyCache.clear();
  }
}

export const BUILT_IN_MODELS: ModelOption[] = [
  // Mistral
  { id: "mistral-large-latest", label: "Mistral Large", provider: "mistral", supportsEmbeddings: true },
  { id: "mistral-small-latest", label: "Mistral Small", provider: "mistral", supportsEmbeddings: true },
  // OpenAI
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "openai", supportsEmbeddings: true },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", supportsEmbeddings: true },
  // Anthropic
  { id: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "anthropic", supportsEmbeddings: false },
  { id: "anthropic/claude-3-5-haiku-20241022", label: "Claude Haiku 3.5", provider: "anthropic", supportsEmbeddings: false },
  // Gemini
  { id: "gemini/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "gemini", supportsEmbeddings: true },
  { id: "gemini/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini", supportsEmbeddings: true },
];

export const PROVIDER_DEFS = {
  mistral: {
    id: "mistral" as ProviderId,
    label: "Mistral",
    keyLabel: "Mistral API Key",
    requiresKey: true,
    builtIn: true,
    models: BUILT_IN_MODELS.filter((m) => m.provider === "mistral"),
  },
  openai: {
    id: "openai" as ProviderId,
    label: "OpenAI",
    keyLabel: "OpenAI API Key",
    requiresKey: true,
    builtIn: true,
    models: BUILT_IN_MODELS.filter((m) => m.provider === "openai"),
  },
  anthropic: {
    id: "anthropic" as ProviderId,
    label: "Anthropic",
    keyLabel: "Anthropic API Key",
    requiresKey: true,
    builtIn: true,
    models: BUILT_IN_MODELS.filter((m) => m.provider === "anthropic"),
  },
  gemini: {
    id: "gemini" as ProviderId,
    label: "Gemini",
    keyLabel: "Gemini API Key",
    requiresKey: true,
    builtIn: true,
    models: BUILT_IN_MODELS.filter((m) => m.provider === "gemini"),
  },
  ollama: {
    id: "ollama" as ProviderId,
    label: "Ollama",
    keyLabel: "",
    requiresKey: false,
    builtIn: false,
    defaultUrl: "http://localhost:11434",
    models: [],
  },
};

export function getProviderForModel(modelId: string): ProviderId {
  const model = BUILT_IN_MODELS.find((m) => m.id === modelId);
  if (model) return model.provider;
  if (modelId.startsWith("openai/")) return "openai";
  if (modelId.startsWith("anthropic/")) return "anthropic";
  if (modelId.startsWith("gemini/")) return "gemini";
  return "mistral";
}

export function getProviderUrl(provider: ProviderId): string {
  switch (provider) {
    case "mistral":   return "https://api.mistral.ai/v1";
    case "openai":    return "https://api.openai.com/v1";
    case "anthropic": return "https://api.anthropic.com/v1";
    case "gemini":    return "https://generativelanguage.googleapis.com/v1beta";
    default:          return "";
  }
}

export const MODEL_MAP: Record<string, { label: string; provider: ProviderId }> = {};
for (const m of BUILT_IN_MODELS) {
  MODEL_MAP[m.id] = { label: m.label, provider: m.provider };
}