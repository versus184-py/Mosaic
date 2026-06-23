import { getProviderConfig } from "./config";

async function authHeaders(): Promise<Record<string, string>> {
  const cfg = getProviderConfig();
  const key = cfg.key();
  if (!key) throw new Error("API key not set. Add it in Settings.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

export async function* streamMistral(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model = "mistral-large-latest"
): AsyncGenerator<string> {
  const headers = await authHeaders();
  const url = getProviderConfig().url;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, temperature, stream: true }),
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Mistral ${res.status}: ${txt.slice(0, 200)}`);
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
      } catch (parseError) {
        console.warn("Failed to parse stream data:", data, parseError);
      }
    }
  }
}

export async function mistralCompletion(
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number,
  signal?: AbortSignal,
  model = "mistral-large-latest"
): Promise<string> {
  const headers = await authHeaders();
  const url = getProviderConfig().url;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    signal,
  });

  if (!res.ok) throw new Error(`Mistral ${res.status}`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
