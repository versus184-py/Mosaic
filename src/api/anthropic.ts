import { getApiKey, getProviderUrl } from "./config";
import type { ProviderId } from "../types/canvas";

const PID: ProviderId = "anthropic";
const BASE = getProviderUrl(PID);

function authHeaders(): Record<string, string> {
  const key = getApiKey(PID);
  if (!key) throw new Error("Anthropic API key not set. Add it in Settings.");
  return {
    "Content-Type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
  };
}

export async function* streamAnthropic(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  const headers = authHeaders();
  const modelId = model.replace("anthropic/", "");
  const body = {
    model: modelId,
    max_tokens: 4096,
    temperature,
    stream: true,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  const res = await fetch(`${BASE}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 200)}`);
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
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          yield parsed.delta.text;
        }
      } catch { /* skip */ }
    }
  }
}