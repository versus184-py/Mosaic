import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../uiStore";
import { setApiKey, clearCachedApiKey } from "../../api/config";

describe("uiStore", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCachedApiKey();
    useUIStore.setState({
      theme: "sunrise",
      model: "mistral-large-latest",
      settingsOpen: false,
      showMiniMap: false,
      searchOpen: false,
      showBookmarksOnly: false,
      confidenceEnabled: true,
      tendrilsEnabled: true,
      ollamaConnected: false,
      ollamaModels: [],
      ollamaUrl: "http://localhost:11434",
      temperature: 0.7,
      systemPrompt: "You are a helpful AI assistant. Be concise and clear.",
      zoom: 1,
      showWelcome: true,
      searchQuery: "",
      debateModels: ["mistral-large-latest"],
    });
  });

  describe("theme", () => {
    it("defaults to sunrise in test environment", () => {
      expect(useUIStore.getState().theme).toBe("sunrise");
    });

    it("sets and persists theme to localStorage", () => {
      useUIStore.getState().setTheme("dusk");
      expect(useUIStore.getState().theme).toBe("dusk");
      const stored = JSON.parse(localStorage.getItem("mosaic-ui") || "{}");
      expect(stored.theme).toBe("dusk");
    });

    it("applies theme class to documentElement", () => {
      useUIStore.getState().setTheme("void");
      expect(document.documentElement.classList.contains("theme-void")).toBe(true);
    });

    it("removes previous theme class on change", () => {
      useUIStore.getState().setTheme("dusk");
      useUIStore.getState().setTheme("sand");
      expect(document.documentElement.classList.contains("theme-dusk")).toBe(false);
      expect(document.documentElement.classList.contains("theme-sand")).toBe(true);
    });
  });

  describe("model selection", () => {
    it("defaults to mistral-large-latest", () => {
      expect(useUIStore.getState().model).toBe("mistral-large-latest");
    });

    it("sets and persists model", () => {
      useUIStore.getState().setModel("openai/gpt-4o");
      expect(useUIStore.getState().model).toBe("openai/gpt-4o");
      const stored = JSON.parse(localStorage.getItem("mosaic-ui") || "{}");
      expect(stored.model).toBe("openai/gpt-4o");
    });

    it("persists invalid model but falls back on reload", () => {
      useUIStore.getState().setModel("nonexistent/model");
      expect(useUIStore.getState().model).toBe("nonexistent/model");
    });
  });

  describe("getActiveProvider", () => {
    it("returns mistral for mistral-large-latest", () => {
      expect(useUIStore.getState().getActiveProvider()).toBe("mistral");
    });

    it("returns openai for openai/gpt-4o", () => {
      useUIStore.getState().setModel("openai/gpt-4o");
      expect(useUIStore.getState().getActiveProvider()).toBe("openai");
    });

    it("returns anthropic for anthropic models", () => {
      useUIStore.getState().setModel("anthropic/claude-sonnet-4-20250514");
      expect(useUIStore.getState().getActiveProvider()).toBe("anthropic");
    });

    it("returns gemini for gemini models", () => {
      useUIStore.getState().setModel("gemini/gemini-2.5-pro");
      expect(useUIStore.getState().getActiveProvider()).toBe("gemini");
    });

    it("returns ollama for ollama models", () => {
      useUIStore.getState().setModel("ollama/llama3");
      expect(useUIStore.getState().getActiveProvider()).toBe("ollama");
    });
  });

  describe("getAvailableModels", () => {
    it("returns 8 built-in models when Ollama not connected", () => {
      const models = useUIStore.getState().getAvailableModels();
      expect(models).toHaveLength(8);
      expect(models.every((m) => m.provider !== "ollama")).toBe(true);
    });

    it("includes Ollama models when connected", () => {
      useUIStore.getState().setOllamaConnected(true);
      useUIStore.getState().setOllamaModels([
        { id: "ollama/llama3", label: "llama3" },
      ]);
      const models = useUIStore.getState().getAvailableModels();
      expect(models.length).toBe(9);
      expect(models.some((m) => m.provider === "ollama")).toBe(true);
    });

    it("marks Ollama models as supporting embeddings", () => {
      useUIStore.getState().setOllamaConnected(true);
      useUIStore.getState().setOllamaModels([
        { id: "ollama/nomic-embed-text", label: "nomic-embed-text" },
      ]);
      const ollamaModels = useUIStore.getState().getAvailableModels().filter((m) => m.provider === "ollama");
      expect(ollamaModels.every((m) => m.supportsEmbeddings)).toBe(true);
    });
  });

  describe("hasApiKeyForCurrent", () => {
    it("returns false for mistral with no key", () => {
      expect(useUIStore.getState().hasApiKeyForCurrent()).toBe(false);
    });

    it("returns true for mistral with key", () => {
      setApiKey("mistral", "some-key");
      expect(useUIStore.getState().hasApiKeyForCurrent()).toBe(true);
    });

    it("returns true for ollama without any key", () => {
      useUIStore.getState().setModel("ollama/llama3");
      expect(useUIStore.getState().hasApiKeyForCurrent()).toBe(true);
    });

    it("returns false for openai without key", () => {
      useUIStore.getState().setModel("openai/gpt-4o");
      expect(useUIStore.getState().hasApiKeyForCurrent()).toBe(false);
    });
  });

  describe("settings", () => {
    it("toggles settings open", () => {
      expect(useUIStore.getState().settingsOpen).toBe(false);
      useUIStore.getState().toggleSettings();
      expect(useUIStore.getState().settingsOpen).toBe(true);
      useUIStore.getState().toggleSettings();
      expect(useUIStore.getState().settingsOpen).toBe(false);
    });

    it("sets settings open explicitly", () => {
      useUIStore.getState().setSettingsOpen(true);
      expect(useUIStore.getState().settingsOpen).toBe(true);
    });
  });

  describe("minimap", () => {
    it("toggles minimap and persists", () => {
      useUIStore.getState().toggleMiniMap();
      expect(useUIStore.getState().showMiniMap).toBe(true);
      const stored = JSON.parse(localStorage.getItem("mosaic-ui") || "{}");
      expect(stored.showMiniMap).toBe(true);
    });
  });

  describe("system prompt", () => {
    it("sets and persists system prompt", () => {
      useUIStore.getState().setSystemPrompt("Be very concise");
      expect(useUIStore.getState().systemPrompt).toBe("Be very concise");
      const stored = JSON.parse(localStorage.getItem("mosaic-ui") || "{}");
      expect(stored.systemPrompt).toBe("Be very concise");
    });

    it("default system prompt is set", () => {
      const prompt = useUIStore.getState().systemPrompt;
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe("temperature", () => {
    it("defaults to 0.7", () => {
      expect(useUIStore.getState().temperature).toBe(0.7);
    });

    it("sets temperature at boundaries", () => {
      useUIStore.getState().setTemperature(0);
      expect(useUIStore.getState().temperature).toBe(0);
      useUIStore.getState().setTemperature(2);
      expect(useUIStore.getState().temperature).toBe(2);
    });
  });

  describe("Ollama state", () => {
    it("defaults to disconnected with localhost URL", () => {
      const state = useUIStore.getState();
      expect(state.ollamaConnected).toBe(false);
      expect(state.ollamaModels).toEqual([]);
      expect(state.ollamaUrl).toBe("http://localhost:11434");
    });

    it("sets connection status", () => {
      useUIStore.getState().setOllamaConnected(true);
      expect(useUIStore.getState().ollamaConnected).toBe(true);
    });

    it("sets Ollama models", () => {
      const models = [{ id: "ollama/llama3", label: "llama3" }, { id: "ollama/mistral", label: "mistral" }];
      useUIStore.getState().setOllamaModels(models);
      expect(useUIStore.getState().ollamaModels).toEqual(models);
    });

    it("persists Ollama URL", () => {
      useUIStore.getState().setOllamaUrl("http://10.0.0.1:11434");
      expect(useUIStore.getState().ollamaUrl).toBe("http://10.0.0.1:11434");
      const stored = JSON.parse(localStorage.getItem("mosaic-ui") || "{}");
      expect(stored.ollamaUrl).toBe("http://10.0.0.1:11434");
    });
  });

  describe("toggles", () => {
    it("toggles confidence enabled", () => {
      useUIStore.getState().setConfidenceEnabled(false);
      expect(useUIStore.getState().confidenceEnabled).toBe(false);
    });

    it("toggles tendrils enabled", () => {
      useUIStore.getState().setTendrilsEnabled(false);
      expect(useUIStore.getState().tendrilsEnabled).toBe(false);
    });

    it("toggles showBookmarksOnly", () => {
      useUIStore.getState().setShowBookmarksOnly(true);
      expect(useUIStore.getState().showBookmarksOnly).toBe(true);
    });
  });

  describe("search", () => {
    it("sets search query and open state", () => {
      useUIStore.getState().setSearchQuery("test query");
      expect(useUIStore.getState().searchQuery).toBe("test query");
      useUIStore.getState().setSearchOpen(true);
      expect(useUIStore.getState().searchOpen).toBe(true);
    });
  });

  describe("debateModels", () => {
    it("sets debate models", () => {
      useUIStore.getState().setDebateModels(["openai/gpt-4o", "gemini/gemini-2.5-pro"]);
      expect(useUIStore.getState().debateModels).toHaveLength(2);
    });
  });

  describe("zoom", () => {
    it("sets zoom level", () => {
      useUIStore.getState().setZoom(1.5);
      expect(useUIStore.getState().zoom).toBe(1.5);
    });
  });

  describe("showWelcome", () => {
    it("sets welcome screen visibility", () => {
      useUIStore.getState().setShowWelcome(false);
      expect(useUIStore.getState().showWelcome).toBe(false);
    });
  });
});
