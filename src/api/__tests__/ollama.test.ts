import { describe, it, expect, beforeEach } from "vitest";
import { getOllamaUrl, setOllamaUrl } from "../ollama";

describe("Ollama URL management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to http://localhost:11434", () => {
    expect(getOllamaUrl()).toBe("http://localhost:11434");
  });

  it("persists custom URL to localStorage", () => {
    setOllamaUrl("http://192.168.1.100:11434");
    expect(getOllamaUrl()).toBe("http://192.168.1.100:11434");
    expect(localStorage.getItem("mosaic-ollama-url")).toBe("http://192.168.1.100:11434");
  });

  it("resets to default after clearing localStorage", () => {
    setOllamaUrl("http://custom:8080");
    localStorage.removeItem("mosaic-ollama-url");
    expect(getOllamaUrl()).toBe("http://localhost:11434");
  });

  it("falls back to default when URL cleared", () => {
    setOllamaUrl("http://custom:8080");
    localStorage.removeItem("mosaic-ollama-url");
    expect(getOllamaUrl()).toBe("http://localhost:11434");
  });
});
