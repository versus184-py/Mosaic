import { describe, it, expect, beforeEach } from "vitest";
import {
  setApiKey, getApiKey, hasApiKey, clearCachedApiKey,
  getProviderForModel, getProviderUrl, BUILT_IN_MODELS, MODEL_MAP, PROVIDER_DEFS
} from "../config";

describe("API key storage", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCachedApiKey();
  });

  it("roundtrips a key through XOR encrypt/decrypt", () => {
    setApiKey("mistral", "test-key-123");
    expect(getApiKey("mistral")).toBe("test-key-123");
  });

  it("stores encrypted value in localStorage (not plaintext)", () => {
    setApiKey("openai", "sk-secret-value");
    const stored = localStorage.getItem("mosaic-api-key-openai");
    expect(stored).not.toBe("sk-secret-value");
    expect(stored).toBeTruthy();
    expect(stored).not.toContain("secret");
  });

  it("returns empty string for unset key", () => {
    expect(getApiKey("mistral")).toBe("");
    expect(hasApiKey("mistral")).toBe(false);
  });

  it("removes key from localStorage when set to empty", () => {
    setApiKey("gemini", "some-key");
    expect(hasApiKey("gemini")).toBe(true);
    setApiKey("gemini", "");
    expect(hasApiKey("gemini")).toBe(false);
    expect(localStorage.getItem("mosaic-api-key-gemini")).toBeNull();
  });

  it("clears single provider from cache", () => {
    setApiKey("anthropic", "anthropic-key");
    clearCachedApiKey("anthropic");
    expect(getApiKey("anthropic")).toBe("anthropic-key");
    expect(localStorage.getItem("mosaic-api-key-anthropic")).toBeTruthy();
  });

  it("clears all providers from cache", () => {
    setApiKey("mistral", "m-key");
    setApiKey("openai", "o-key");
    clearCachedApiKey();
    expect(getApiKey("mistral")).toBe("m-key");
    expect(getApiKey("openai")).toBe("o-key");
  });

  it("caches key after first read to avoid repeated decrypt", () => {
    localStorage.setItem("mosaic-api-key-mistral", btoa("cached-check"));
    clearCachedApiKey();
    const first = getApiKey("mistral");
    const second = getApiKey("mistral");
    expect(first).toBe(second);
  });

  it("handles malformed localStorage value gracefully", () => {
    localStorage.setItem("mosaic-api-key-mistral", "not-valid-base64!!");
    expect(getApiKey("mistral")).toBe("");
  });

  it("handles all 5 provider keys independently", () => {
    const providers = ["mistral", "openai", "anthropic", "gemini", "ollama"] as const;
    providers.forEach((p, i) => setApiKey(p, `key-${i}`));
    providers.forEach((p, i) => expect(getApiKey(p)).toBe(`key-${i}`));
  });
});

describe("getProviderForModel", () => {
  it("resolves mistral-large-latest to mistral", () => {
    expect(getProviderForModel("mistral-large-latest")).toBe("mistral");
  });

  it("resolves openai/gpt-4o to openai", () => {
    expect(getProviderForModel("openai/gpt-4o")).toBe("openai");
  });

  it("resolves anthropic/claude-sonnet-4-20250514 to anthropic", () => {
    expect(getProviderForModel("anthropic/claude-sonnet-4-20250514")).toBe("anthropic");
  });

  it("resolves gemini/gemini-2.5-pro to gemini", () => {
    expect(getProviderForModel("gemini/gemini-2.5-pro")).toBe("gemini");
  });

  it("resolves ollama/llama3 to mistral (fallback, no built-in match)", () => {
    expect(getProviderForModel("ollama/llama3")).toBe("mistral");
  });

  it("defaults to mistral for unknown model", () => {
    expect(getProviderForModel("unknown/model")).toBe("mistral");
  });

  it("defaults to mistral for empty string", () => {
    expect(getProviderForModel("")).toBe("mistral");
  });
});

describe("getProviderUrl", () => {
  it("returns Mistral URL", () => {
    expect(getProviderUrl("mistral")).toBe("https://api.mistral.ai/v1");
  });

  it("returns OpenAI URL", () => {
    expect(getProviderUrl("openai")).toBe("https://api.openai.com/v1");
  });

  it("returns Anthropic URL", () => {
    expect(getProviderUrl("anthropic")).toBe("https://api.anthropic.com/v1");
  });

  it("returns Gemini URL", () => {
    expect(getProviderUrl("gemini")).toBe("https://generativelanguage.googleapis.com/v1beta");
  });

  it("returns empty for ollama", () => {
    expect(getProviderUrl("ollama")).toBe("");
  });
});

describe("BUILT_IN_MODELS", () => {
  it("has 8 models", () => {
    expect(BUILT_IN_MODELS).toHaveLength(8);
  });

  it("each model has required fields", () => {
    for (const m of BUILT_IN_MODELS) {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(["mistral", "openai", "anthropic", "gemini"]).toContain(m.provider);
      expect(typeof m.supportsEmbeddings).toBe("boolean");
    }
  });

  it("Anthropic models do not support embeddings", () => {
    const anthropicModels = BUILT_IN_MODELS.filter((m) => m.provider === "anthropic");
    expect(anthropicModels.length).toBeGreaterThan(0);
    expect(anthropicModels.every((m) => !m.supportsEmbeddings)).toBe(true);
  });

  it("other providers support embeddings", () => {
    const nonAnthropic = BUILT_IN_MODELS.filter((m) => m.provider !== "anthropic");
    expect(nonAnthropic.every((m) => m.supportsEmbeddings)).toBe(true);
  });
});

describe("MODEL_MAP", () => {
  it("has entry for every built-in model", () => {
    for (const m of BUILT_IN_MODELS) {
      expect(MODEL_MAP[m.id]).toBeDefined();
      expect(MODEL_MAP[m.id].label).toBe(m.label);
      expect(MODEL_MAP[m.id].provider).toBe(m.provider);
    }
  });
});

describe("PROVIDER_DEFS", () => {
  it("has mistral with correct shape", () => {
    expect(PROVIDER_DEFS.mistral.requiresKey).toBe(true);
    expect(PROVIDER_DEFS.mistral.models.length).toBe(2);
  });

  it("has ollama with requiresKey false", () => {
    expect(PROVIDER_DEFS.ollama.requiresKey).toBe(false);
    expect(PROVIDER_DEFS.ollama.models).toEqual([]);
  });

  it("has all 5 providers", () => {
    expect(Object.keys(PROVIDER_DEFS)).toEqual(["mistral", "openai", "anthropic", "gemini", "ollama"]);
  });
});
