import { getApiKey, getProviderUrl } from "./config";
import type { ProviderId } from "../types/canvas";

const PID: ProviderId = "openai";
const BASE = getProviderUrl(PID);

function authHeaders(): Record<string, string> {
  const key = getApiKey(PID);
  if (!key) throw new Error("OpenAI API key not set. Add it in Settings.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

export async function* streamOpenAI(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  const headers = authHeaders();
  const modelId = model.replace("openai/", "");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: modelId, messages, temperature, stream: true }),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`);
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
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip */ }
    }
  }
}

export async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const headers = authHeaders();
  const res = await fetch(`${BASE}/embeddings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI embed ${res.status}`);
  const data = await res.json();
  return (data.data as { embedding: number[] }[]).map((d) => d.embedding);
}