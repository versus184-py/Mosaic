export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateNodeData(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(data)) { return { valid: false, errors: ["data must be an object"] }; }
  if (typeof data.id !== "string") errors.push("data.id must be a string");
  if (typeof data.label !== "string") errors.push("data.label must be a string");
  if (!Array.isArray(data.messages)) errors.push("data.messages must be an array");
  if (typeof data.isActive !== "boolean") errors.push("data.isActive must be a boolean");
  if (typeof data.isTyping !== "boolean") errors.push("data.isTyping must be a boolean");
  if (data.nodeType !== "root" && data.nodeType !== "branch" && data.nodeType !== "response" && data.nodeType !== "suggestion" && data.nodeType !== "distillation") {
    errors.push("data.nodeType must be 'root', 'branch', 'response', 'suggestion', or 'distillation'");
  }
  return { valid: errors.length === 0, errors };
}

export function validateImportedCanvas(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(data)) return { valid: false, errors: ["Imported data must be a JSON object"] };
  if (!Array.isArray(data.nodes)) errors.push("nodes must be an array");
  if (!Array.isArray(data.edges)) errors.push("edges must be an array");

  if (Array.isArray(data.nodes)) {
    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i];
      if (!isRecord(node)) { errors.push(`nodes[${i}] must be an object`); continue; }
      if (typeof node.id !== "string") errors.push(`nodes[${i}].id must be a string`);
      if (typeof node.type !== "string") errors.push(`nodes[${i}].type must be a string`);
      if (!isRecord(node.position)) errors.push(`nodes[${i}].position must be an object`);
      else if (node.position) {
        const pos = node.position as Record<string, unknown>;
        if (typeof pos.x !== "number") errors.push(`nodes[${i}].position.x must be a number`);
        if (typeof pos.y !== "number") errors.push(`nodes[${i}].position.y must be a number`);
      }
      if (!isRecord(node.data)) errors.push(`nodes[${i}].data must be an object`);
      else errors.push(...validateNodeData(node.data).errors.map((e) => `nodes[${i}].${e}`));
    }
  }
  if (Array.isArray(data.edges)) {
    for (let i = 0; i < data.edges.length; i++) {
      const edge = data.edges[i];
      if (!isRecord(edge)) { errors.push(`edges[${i}] must be an object`); continue; }
      if (typeof edge.id !== "string") errors.push(`edges[${i}].id must be a string`);
      if (typeof edge.source !== "string") errors.push(`edges[${i}].source must be a string`);
      if (typeof edge.target !== "string") errors.push(`edges[${i}].target must be a string`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateCanvasData(data: unknown): ValidationResult {
  if (!isRecord(data)) return { valid: false, errors: ["Canvas data must be an object"] };
  return validateImportedCanvas(data);
}

export function validateRagDocs(data: unknown): ValidationResult {
  if (!Array.isArray(data)) return { valid: false, errors: ["Documents must be an array"] };
  const errors: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const doc = data[i];
    if (!isRecord(doc)) { errors.push(`docs[${i}] must be an object`); continue; }
    if (typeof doc.id !== "string") errors.push(`docs[${i}].id must be a string`);
    if (typeof doc.name !== "string") errors.push(`docs[${i}].name must be a string`);
    if (typeof doc.type !== "string") errors.push(`docs[${i}].type must be a string`);
    if (typeof doc.size !== "number") errors.push(`docs[${i}].size must be a number`);
    if (!Array.isArray(doc.chunks)) errors.push(`docs[${i}].chunks must be an array`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateUIState(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(data)) return { valid: false, errors: ["UI state must be an object"] };
  const validThemes = ["void", "dusk", "sand", "snow", "sunrise"];
  if (data.theme && !validThemes.includes(data.theme as string)) {
    errors.push(`Invalid theme: ${data.theme}`);
  }
  if (data.temperature !== undefined && (typeof data.temperature !== "number" || data.temperature < 0 || data.temperature > 2)) {
    errors.push("temperature must be a number between 0 and 2");
  }
  return { valid: errors.length === 0, errors };
}
