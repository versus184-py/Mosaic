import { getApiKey, getProviderUrl } from "./config";
import type { ProviderId } from "../types/canvas";

const PID: ProviderId = "gemini";
const BASE = getProviderUrl(PID);

export async function* streamGemini(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  const key = getApiKey(PID);
  if (!key) throw new Error("Gemini API key not set. Add it in Settings.");
  const modelId = model.replace("gemini/", "");
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url = `${BASE}/models/${modelId}:streamGenerateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig: { temperature } }),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
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
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch { /* skip */ }
    }
  }
}

export async function embedGemini(texts: string[]): Promise<number[][]> {
  const key = getApiKey(PID);
  if (!key) throw new Error("Gemini API key not set.");
  const results: number[][] = [];
  for (const text of texts) {
    const url = `${BASE}/models/text-embedding-004:embedContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
    });
    if (!res.ok) throw new Error(`Gemini embed ${res.status}`);
    const data = await res.json();
    results.push(data.embedding?.values || []);
  }
  return results;
}