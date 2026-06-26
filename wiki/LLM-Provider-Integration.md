# LLM Provider Integration

Mosaic connects to **five LLM providers**: Mistral AI (primary), OpenAI, Anthropic, Gemini, and Ollama (local). This page documents the provider architecture, configuration, model options, and how providers interact with features like streaming, embeddings, and parallel debate.

---

## Architecture Overview

The provider system is designed around a **unified interface** with provider-specific implementations:

```
User Input
    │
    ▼
useStreamMessage (hook)
    │
    ▼
streamProvider(model, messages, config)
    │
    ├── Mistral: streamMistral()
    ├── OpenAI: streamOpenAI()
    ├── Anthropic: streamAnthropic()
    ├── Gemini: streamGemini()
    └── Ollama: streamOllama()
    │
    ▼
SSE Stream → Chunk-by-chunk parsing → canvasStore update
```

### Provider Router (`src/api/providers.ts`)

The `streamProvider()` function routes requests based on the model name prefix:

| Model Prefix | Provider | Function |
|-------------|----------|----------|
| `mistral-*` | Mistral AI | `streamMistral()` |
| `gpt-*` | OpenAI | `streamOpenAI()` |
| `claude-*` | Anthropic | `streamAnthropic()` |
| `gemini-*` | Gemini | `streamGemini()` |
| Any other | Ollama | `streamOllama()` |

The `embedTexts()` function similarly routes embedding requests through available providers in priority order: Ollama → Mistral → OpenAI → Gemini.

---

## Provider Configuration

### Request Construction

Each provider function constructs the appropriate HTTP request:

```typescript
// Common interface
interface ProviderRequest {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  body: string;  // JSON-serialized
  signal?: AbortSignal;
}
```

The differences between providers are primarily in:
- **Authentication**: Bearer token vs. x-api-key header vs. URL parameter
- **Message format**: OpenAI-compatible format vs. Anthropic's content blocks vs. Gemini's contents/parts
- **System prompt placement**: Part of messages array vs. separate system parameter vs. systemInstruction field
- **Streaming response format**: Standard SSE vs. event-based SSE vs. JSON lines

### API Key Storage

API keys are stored in `localStorage` using **XOR encryption** with a salt key (`MosaicKeySalt`):

```typescript
// Encryption (simplified)
function encryptKey(key: string): string {
  const salt = 'MosaicKeySalt';
  let result = '';
  for (let i = 0; i < key.length; i++) {
    result += String.fromCharCode(
      key.charCodeAt(i) ^ salt.charCodeAt(i % salt.length)
    );
  }
  return btoa(result);
}
```

Keys are cached in memory after decryption to avoid repeated decoding. This is not production-grade encryption — it prevents **casual exposure** of keys in localStorage but should not be considered secure against determined access.

### Provider Configuration Table

| Provider | Auth Method | Header | Env/Setting |
|----------|-------------|--------|-------------|
| Mistral | Bearer token | `Authorization: Bearer {key}` | Settings → API Key |
| OpenAI | Bearer token | `Authorization: Bearer {key}` | Settings → OpenAI |
| Anthropic | x-api-key | `x-api-key: {key}` | Settings → Anthropic |
| Gemini | URL query | `?key={key}` (in URL) | Settings → Gemini |
| Ollama | None | — | Settings → URL |

---

## Provider Details

### Mistral AI (Primary Provider)

**API Base**: `https://api.mistral.ai/v1`

**Supported Models**:

| Model | ID | Best For |
|-------|-----|----------|
| Mistral Large | `mistral-large-latest` | Complex reasoning, code generation, analysis |
| Mistral Small | `mistral-small-latest` | Quick responses, simpler tasks, cost-effective |

**Streaming**: SSE-based streaming with `{ "choices": [{ "delta": { "content": "..." } }] }` chunks.

**Embeddings**: Available via `mistral-embed` model (used for RAG embedding search).

**Pricing** (built into analytics):

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|-----------------------|
| Mistral Large | $2.00 | $6.00 |
| Mistral Small | $0.20 | $0.60 |

### OpenAI

**API Base**: `https://api.openai.com/v1`

**Supported Models**:

| Model | ID |
|-------|-----|
| GPT-4o | `gpt-4o` |
| GPT-4o mini | `gpt-4o-mini` |

**Streaming**: SSE with `data: { choices: [{ delta: { content: "..." } }] }` — terminated by `data: [DONE]`.

**Embeddings**: Available via `text-embedding-3-small` model.

### Anthropic

**API Base**: `https://api.anthropic.com/v1`

**Supported Models**:

| Model | ID |
|-------|-----|
| Claude Sonnet 4 | `claude-sonnet-4-20250514` |
| Claude Haiku 3.5 | `claude-haiku-3-5-20241022` |

**Streaming**: SSE with `content_block_delta` events. Anthropic's streaming format differs from others — it sends `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, and `message_stop` events.

**Embeddings**: Not supported (Anthropic does not offer an embeddings API).

### Gemini

**API Base**: `https://generativelanguage.googleapis.com/v1beta`

**Supported Models**:

| Model | ID |
|-------|-----|
| Gemini 2.5 Pro | `gemini/gemini-2.5-pro` |
| Gemini 2.5 Flash | `gemini/gemini-2.5-flash` |

**Streaming**: SSE with `candidates[0].content.parts[0].text` chunk extraction.

**Embeddings**: Available via `text-embedding-004` model.

### Ollama (Local)

**API Base**: Configurable (default `http://localhost:11434`)

**Authentication**: None required.

**Model Discovery**: Mosaic auto-detects available models on startup via the `useOllamaDetect` hook, which polls `http://localhost:11434/api/tags`. Connection status and model list are updated automatically in the Settings drawer.

**Streaming**: JSON-lines streaming from Ollama's `/api/chat` endpoint.

**Embeddings**: Available via `nomic-embed-text` model (must be pulled in Ollama first).

**Setup**:
1. Install [Ollama](https://ollama.com/)
2. Run `ollama serve`
3. Pull models: `ollama pull llama3.2` (or any model)
4. In Mosaic Settings, set URL to `http://localhost:11434`
5. Mosaic auto-detects on startup — no manual detection needed

> **Note**: Ollama must be running on the same machine. Mosaic checks the connection on startup and grays out Ollama options if unavailable.

---

## Streaming Implementation

### Protocol Differences

Each provider uses a slightly different SSE format. Mosaic's provider modules parse each format and normalize the output.

**Mistral / OpenAI / Gemini** (standard SSE):
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

**Anthropic** (event-based):
```
event: message_start
data: {"type":"message_start",...}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"text":"Hello"}}

event: message_stop
data: {"type":"message_stop",...}
```

**Ollama** (JSON lines):
```json
{"message":{"content":"Hello"}}
{"message":{"content":" world"}}
{"done":true}
```

### Error Handling

All providers implement robust error handling:

| Scenario | Behavior |
|----------|----------|
| Network error | Retry with exponential backoff |
| Invalid API key | Show error with provider-specific message |
| Rate limited | Show rate limit error |
| Stream timeout | Abort and show retry button on response node |
| Abort (user stop) | Cleanly cancel stream via AbortController |

### AbortController

Each streaming request is associated with an **AbortController**. This enables:
- Stopping a response mid-stream (user clicks stop)
- Cancelling stale requests when a new one is sent
- Cleanup on component unmount

---

## Model Selection

Users select models from a dropdown in the TopBar. Models are grouped by provider with colored indicators:

| Provider | Color |
|----------|-------|
| Mistral | Blue |
| OpenAI | Green |
| Anthropic | Orange |
| Gemini | Yellow |
| Ollama | Purple |

### Available Models

The `getAvailableModels()` function (in `uiStore`) returns:
- All built-in models from all configured providers
- Auto-detected Ollama models (when Ollama is connected)
- Models are grouped and sorted for easy selection

### Active Provider Detection

The UI automatically detects which provider is selected and:
- Shows/hides provider-specific settings
- Validates that the required API key is configured
- Shows a warning if no key is available for the selected model

### Provider Factory Pattern

Each provider module exports a consistent interface — an `AsyncGenerator` for streaming and a `Promise` for embeddings:

```typescript
// src/api/mistral.ts
export async function* streamMistral(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> { ... }

export async function embedMistral(
  texts: string[]
): Promise<number[][]> { ... }
```

The central `streamProvider()` router in `providers.ts` uses `yield*` to delegate to each provider's generator:

```typescript
export async function* streamProvider(
  messages: { role: string; content: string }[],
  temperature: number,
  signal: AbortSignal,
  model: string
): AsyncGenerator<string> {
  const provider = getProviderForModel(model);
  switch (provider) {
    case "mistral": yield* streamMistral(...); break;
    case "openai":  yield* streamOpenAI(...);  break;
    // ...
  }
}
```

This pattern makes it easy to add new providers — implement `stream*` (AsyncGenerator) and `embed*`, register the model in `config.ts`, and add the routing case in `providers.ts`.

---

## Embeddings for RAG

Mosaic's RAG system uses embeddings for semantic search. The `embedTexts()` function tries providers in this order:

1. **Ollama** (fastest, local) — `nomic-embed-text`
2. **Mistral** — `mistral-embed`
3. **OpenAI** — `text-embedding-3-small`
4. **Gemini** — `text-embedding-004`

Each provider is tried in sequence; if one fails, the next is attempted. `embedTexts()` returns `null` only if **all** providers fail — it never throws. If `null` is returned, the RAG system falls back to **TF-IDF cosine similarity** (a statistical method that requires no external API).

---

## Parallel Debate

The **parallel debate** feature (triggered by `Shift+Enter`) sends the same input to **multiple models simultaneously**:

1. The user selects which models to include (in Settings → Debate Models)
2. When `Shift+Enter` is pressed, `useParallelDebate` fans out requests via `Promise.allSettled`
3. Each response streams independently into its own response node
4. Response nodes are arranged in a fan pattern for side-by-side comparison

This allows you to compare how different models handle the same prompt in real time.

---

## Security

- **API keys never leave your machine** — they are sent directly to provider APIs from the webview
- **CSP restricts connect-src** to known API endpoints only
- **No third-party telemetry** — Mosaic does not collect or transmit usage data

---

## Next Steps

- [[RAG System Guide]] — How documents are indexed and searched
- [[Advanced AI Features]] — Confidence scoring, distillation, pruning, debate
- [[Provider Protocol and Streaming]] — Deep dive into streaming implementation
