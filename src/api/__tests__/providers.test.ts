import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mockOllama = vi.fn();
const mockMistral = vi.fn();
const mockOpenAI = vi.fn();
const mockGemini = vi.fn();

vi.mock("../ollama", () => ({ embedOllama: (...args: unknown[]) => mockOllama(...args) }));
vi.mock("../mistral", () => ({ embedMistral: (...args: unknown[]) => mockMistral(...args) }));
vi.mock("../openai", () => ({ embedOpenAI: (...args: unknown[]) => mockOpenAI(...args) }));
vi.mock("../gemini", () => ({ embedGemini: (...args: unknown[]) => mockGemini(...args) }));

let embedTexts: (texts: string[]) => Promise<number[][] | null>;

describe("embedTexts", () => {
  beforeAll(async () => {
    const mod = await import("../providers");
    embedTexts = mod.embedTexts;
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when all providers fail", async () => {
    mockOllama.mockRejectedValue(new Error("connection refused"));
    mockMistral.mockRejectedValue(new Error("no key"));
    mockOpenAI.mockRejectedValue(new Error("rate limited"));
    mockGemini.mockRejectedValue(new Error("quota exceeded"));

    const result = await embedTexts(["hello world"]);
    expect(result).toBeNull();
  });

  it("returns ollama result when ollama succeeds", async () => {
    const mockEmbedding = [[0.1, 0.2, 0.3]];
    mockOllama.mockResolvedValue(mockEmbedding);

    const result = await embedTexts(["hello"]);
    expect(result).toEqual(mockEmbedding);
  });

  it("falls through to mistral when ollama fails", async () => {
    const mockEmbedding = [[0.4, 0.5, 0.6]];
    mockOllama.mockRejectedValue(new Error("offline"));
    mockMistral.mockResolvedValue(mockEmbedding);

    const result = await embedTexts(["test"]);
    expect(result).toEqual(mockEmbedding);
  });

  it("returns null for empty input", async () => {
    const result = await embedTexts([]);
    expect(result).toBeNull();
  });
});
