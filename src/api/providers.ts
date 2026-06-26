// Single-provider mode (Mistral). When multi-provider is added, import
// streamOpenAI/streamAnthropic and route via MODEL_MAP[model].provider.
import { streamMistral } from "./mistral";

export async function* streamProvider(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  yield* streamMistral(messages, temperature, signal, model);
}
