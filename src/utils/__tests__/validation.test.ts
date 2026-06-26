import { describe, it, expect } from "vitest";
import {
  validateImportedCanvas, validateNodeData, validateRagDocs,
  validateUIState, validateCanvasData,
} from "../validation";

describe("validateNodeData", () => {
  const valid = () => ({
    id: "n1", label: "Hello", messages: [], isActive: true, isTyping: false, nodeType: "root" as const,
  });

  it("accepts valid data", () => {
    expect(validateNodeData(valid()).valid).toBe(true);
  });

  it("rejects non-object", () => {
    expect(validateNodeData("string").valid).toBe(false);
    expect(validateNodeData(null).valid).toBe(false);
    expect(validateNodeData(42).valid).toBe(false);
    expect(validateNodeData([]).valid).toBe(false);
  });

  it("rejects missing id", () => {
    const { id, ...rest } = valid();
    expect(validateNodeData(rest).valid).toBe(false);
  });

  it("rejects missing label", () => {
    const { label, ...rest } = valid();
    expect(validateNodeData(rest).valid).toBe(false);
  });

  it("rejects missing messages", () => {
    const { messages, ...rest } = valid();
    expect(validateNodeData(rest).valid).toBe(false);
  });

  it("rejects non-array messages", () => {
    expect(validateNodeData({ ...valid(), messages: "not-array" }).valid).toBe(false);
  });

  it("rejects invalid nodeType", () => {
    expect(validateNodeData({ ...valid(), nodeType: "invalid" }).valid).toBe(false);
  });

  it("accepts all valid nodeTypes", () => {
    for (const t of ["root", "branch", "response", "suggestion", "distillation"]) {
      expect(validateNodeData({ ...valid(), nodeType: t }).valid).toBe(true);
    }
  });

  it("rejects non-boolean isActive", () => {
    expect(validateNodeData({ ...valid(), isActive: "yes" }).valid).toBe(false);
  });

  it("rejects non-boolean isTyping", () => {
    expect(validateNodeData({ ...valid(), isTyping: 1 }).valid).toBe(false);
  });
});

describe("validateImportedCanvas", () => {
  const validCanvas = () => ({
    nodes: [{
      id: "n1", type: "messageNode",
      position: { x: 0, y: 0 },
      data: { id: "n1", label: "Hi", messages: [], isActive: true, isTyping: false, nodeType: "root" },
    }],
    edges: [{ id: "e1", source: "n1", target: "n2" }],
  });

  it("accepts valid canvas", () => {
    expect(validateImportedCanvas(validCanvas()).valid).toBe(true);
  });

  it("rejects non-object", () => {
    expect(validateImportedCanvas(null).valid).toBe(false);
    expect(validateImportedCanvas("string").valid).toBe(false);
  });

  it("rejects missing nodes", () => {
    expect(validateImportedCanvas({}).valid).toBe(false);
  });

  it("rejects non-array nodes", () => {
    expect(validateImportedCanvas({ nodes: "not-array", edges: [] }).valid).toBe(false);
  });

  it("rejects non-array edges", () => {
    expect(validateImportedCanvas({ nodes: [], edges: "not-array" }).valid).toBe(false);
  });

  it("validates each node's position", () => {
    const canvas = validCanvas();
    canvas.nodes[0].position = { x: "invalid", y: 0 } as any;
    const result = validateImportedCanvas(canvas);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("position.x"))).toBe(true);
  });

  it("rejects nodes with non-string id", () => {
    const canvas = validCanvas();
    canvas.nodes[0].id = 123 as any;
    expect(validateImportedCanvas(canvas).valid).toBe(false);
  });

  it("validates edge source/target are strings", () => {
    const canvas = validCanvas();
    canvas.edges[0].source = 123 as any;
    expect(validateImportedCanvas(canvas).valid).toBe(false);
  });

  it("exposes all errors", () => {
    const result = validateImportedCanvas({
      nodes: [{ id: 123, type: 456, position: null, data: null }],
      edges: [{ id: 789, source: null, target: null }],
    });
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
  });
});

describe("validateCanvasData", () => {
  it("returns valid for a valid canvas", () => {
    expect(validateCanvasData({
      nodes: [], edges: [],
    }).valid).toBe(true);
  });

  it("returns invalid for non-object", () => {
    expect(validateCanvasData(null).valid).toBe(false);
  });
});

describe("validateRagDocs", () => {
  it("accepts valid docs", () => {
    const docs = [
      { id: "d1", name: "doc.txt", type: ".txt", size: 100, chunks: [{ text: "hello", index: 0 }] },
    ];
    expect(validateRagDocs(docs).valid).toBe(true);
  });

  it("rejects non-array", () => {
    expect(validateRagDocs(null).valid).toBe(false);
    expect(validateRagDocs({}).valid).toBe(false);
  });

  it("checks each doc has required fields", () => {
    const docs = [{ id: "d1" }];
    const result = validateRagDocs(docs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("name"))).toBe(true);
    expect(result.errors.some((e) => e.includes("type"))).toBe(true);
    expect(result.errors.some((e) => e.includes("size"))).toBe(true);
    expect(result.errors.some((e) => e.includes("chunks"))).toBe(true);
  });

  it("rejects non-object doc entries", () => {
    expect(validateRagDocs(["string"]).valid).toBe(false);
  });

  it("rejects non-array chunks", () => {
    const docs = [{ id: "d1", name: "doc.txt", type: ".txt", size: 100, chunks: "not-array" }];
    expect(validateRagDocs(docs).valid).toBe(false);
  });

  it("accepts chunks with embeddings", () => {
    const docs = [
      { id: "d1", name: "doc.txt", type: ".txt", size: 100, chunks: [{ text: "hello", index: 0, embedding: [0.1] }] },
    ];
    expect(validateRagDocs(docs).valid).toBe(true);
  });
});

describe("validateUIState", () => {
  it("accepts valid state", () => {
    expect(validateUIState({ theme: "void", temperature: 0.5 }).valid).toBe(true);
  });

  it("accepts empty state", () => {
    expect(validateUIState({}).valid).toBe(true);
  });

  it("rejects invalid theme", () => {
    expect(validateUIState({ theme: "neon" }).valid).toBe(false);
  });

  it("accepts valid themes", () => {
    for (const t of ["void", "dusk", "sand", "snow", "sunrise"]) {
      expect(validateUIState({ theme: t }).valid).toBe(true);
    }
  });

  it("rejects temperature too high", () => {
    expect(validateUIState({ temperature: 2.5 }).valid).toBe(false);
  });

  it("rejects temperature too low", () => {
    expect(validateUIState({ temperature: -0.1 }).valid).toBe(false);
  });

  it("accepts temperature at boundaries", () => {
    expect(validateUIState({ temperature: 0 }).valid).toBe(true);
    expect(validateUIState({ temperature: 2 }).valid).toBe(true);
  });

  it("rejects non-numeric temperature", () => {
    expect(validateUIState({ temperature: "hot" }).valid).toBe(false);
  });
});
