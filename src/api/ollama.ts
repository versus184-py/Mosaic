import type { ProviderId } from "../types/canvas";

const PID: ProviderId = "ollama";
const DEFAULT_URL = "http://localhost:11434";

function getBaseUrl(): string {
  try {
    const stored = localStorage.getItem("mosaic-ollama-url");
    return stored || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

function setBaseUrl(url: string) {
  try { localStorage.setItem("mosaic-ollama-url", url); } catch { /* noop */ }
}

export interface OllamaModel {
  id: string;
  label: string;
}

export async function checkOllamaConnection(url?: string): Promise<boolean> {
  const base = url || getBaseUrl();
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listOllamaModels(url?: string): Promise<OllamaModel[]> {
  const base = url || getBaseUrl();
  const res = await fetch(`${base}/api/tags`);
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.models || []) as { name: string }[]).map((m) => ({
    id: `ollama/${m.name}`,
    label: m.name,
  }));
}

export async function* streamOllama(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  const base = getBaseUrl();
  const modelId = model.replace("ollama/", "");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelId, messages, stream: true, options: { temperature } }),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${txt.slice(0, 200)}`);
  }
  if (!res.body) throw new Error("Response body is empty");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        const parsed = JSON.parse(t);
        const content = parsed.message?.content;
        if (content) yield content;
        if (parsed.done) return;
      } catch { /* skip */ }
    }
  }
}

export async function embedOllama(texts: string[]): Promise<number[][]> {
  const base = getBaseUrl();
  // Use nomic-embed-text which is commonly available
  const results: number[][] = [];
  for (const text of texts) {
    const res = await fetch(`${base}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
    });
    if (!res.ok) throw new Error(`Ollama embed ${res.status}`);
    const data = await res.json();
    results.push(data.embedding || []);
  }
  return results;
}

export { getBaseUrl as getOllamaUrl, setBaseUrl as setOllamaUrl };
