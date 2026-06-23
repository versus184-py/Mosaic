import { streamMistral } from "./mistral";

export async function* streamProvider(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  yield* streamMistral(messages, temperature, signal, model);
}
