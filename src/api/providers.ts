import { getProviderForModel } from "./config";
import { streamMistral, embedMistral } from "./mistral";
import { streamOpenAI, embedOpenAI } from "./openai";
import { streamAnthropic } from "./anthropic";
import { streamGemini, embedGemini } from "./gemini";
import { streamOllama, embedOllama } from "./ollama";

export async function* streamProvider(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  const provider = getProviderForModel(model);
  switch (provider) {
    case "mistral":
      yield* streamMistral(messages, temperature, signal, model);
      break;
    case "openai":
      yield* streamOpenAI(messages, temperature, signal, model);
      break;
    case "anthropic":
      yield* streamAnthropic(messages, temperature, signal, model);
      break;
    case "gemini":
      yield* streamGemini(messages, temperature, signal, model);
      break;
    case "ollama":
      yield* streamOllama(messages, temperature, signal, model);
      break;
  }
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const errors: string[] = [];

  // Priority: Ollama (offline) -> Mistral -> OpenAI -> Gemini
  for (const attempt of [
    { provider: "ollama" as const, fn: embedOllama },
    { provider: "mistral" as const, fn: embedMistral },
    { provider: "openai" as const, fn: embedOpenAI },
    { provider: "gemini" as const, fn: embedGemini },
  ]) {
    try {
      const result = await attempt.fn(texts);
      if (result && result.length > 0 && result[0].length > 0) {
        return result;
      }
    } catch (e: unknown) {
      errors.push(`${attempt.provider}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.warn("All embedding providers failed:", errors.join("; "));
  return null;
}