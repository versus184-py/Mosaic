# Provider Protocol and Streaming

This page details how Mosaic communicates with each LLM provider — the streaming protocols, authentication, error handling, and embedding integrations.

---

## Streaming Architecture

All providers use **Server-Sent Events (SSE)** for streaming, though the event format varies by provider. Mosaic normalizes these into a uniform streaming interface.

```
Main Thread:
  streamProvider(model, messages, config)
       │
       ├── GET/POST → Provider API endpoint
       │     with Authorization header
       │
       ▼
  ReadableStream (SSE)
       │
       ├── Parse SSE events (format varies by provider)
       ├── Extract text delta from each event
       ├── Call onChunk(delta) callback
       └── On stream end → resolve promise
```

### Shared StreamConfig

```typescript
interface StreamConfig {
  temperature?: number;       // 0.0 - 2.0 (provider-specific mapping)
  systemPrompt?: string;     // System message
  signal?: AbortSignal;      // For cancellation
  onChunk?: (chunk: string) => void;  // Called with each text delta
}
```

All provider functions accept this config and return a `Promise<ReadableStreamDefaultReader>`.

---

## Provider-Specific Protocols

### Mistral AI

**Endpoint**: `POST https://api.mistral.ai/v1/chat/completions`

**Headers**:
```http
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Request Body**:
```json
{
  "model": "mistral-large-latest",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "stream": true
}
```

**SSE Format**:
```
data: {"id":"...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: {"id":"...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: {"id":"...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

**Extraction**: `JSON.parse(event).choices[0].delta.content || ''`

**Embeddings**: `POST https://api.mistral.ai/v1/embeddings` with model `mistral-embed`.

---

### OpenAI

**Endpoint**: `POST https://api.openai.com/v1/chat/completions`

**Headers**:
```http
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Request Body**:
```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "stream": true
}
```

**SSE Format**: Same structure as Mistral (OpenAI-compatible API).

```
data: {"choices":[{"delta":{"role":"assistant","content":"Hello"},"index":0}]}

data: {"choices":[{"delta":{"content":" world"},"index":0}]}

data: [DONE]
```

**Extraction**: `JSON.parse(event).choices[0].delta.content || ''`

**Stream end**: Detected by `data: [DONE]` line.

**Embeddings**: `POST https://api.openai.com/v1/embeddings` with model `text-embedding-3-small`.

---

### Anthropic

**Endpoint**: `POST https://api.anthropic.com/v1/messages`

**Headers**:
```http
x-api-key: {api_key}
anthropic-version: 2023-06-01
Content-Type: application/json
```

Note: Anthropic uses `x-api-key` header instead of `Authorization: Bearer`.

**Request Body**:
```json
{
  "model": "claude-sonnet-4-20250514",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "system": "You are a helpful assistant.",
  "temperature": 0.7,
  "stream": true
}
```

**SSE Format** (event-based — different from OpenAI/Mistral):

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_...","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-20250514","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":1}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_stop
data: {"type":"message_stop","message":{"id":"msg_...","type":"message","role":"assistant","content":[{"type":"text","text":"Hello world"}],"stop_reason":"end_turn","stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":2}}}
```

**Extraction**: Only `content_block_delta` events with `delta.type === 'text_delta'` contain text.

```typescript
if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
  chunk = event.delta.text;
}
```

**Stream end**: Detected by `message_stop` event.

**Embeddings**: Not supported by Anthropic API.

---

### Gemini

**Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key={api_key}`

Note: The API key is passed as a **URL query parameter**, not a header.

**Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello!"}]
    }
  ],
  "systemInstruction": {
    "parts": [{"text": "You are a helpful assistant."}]
  },
  "generationConfig": {
    "temperature": 0.7
  }
}
```

**SSE Format**:
```
data: {"candidates":[{"index":0,"content":{"role":"model","parts":[{"text":"Hello"}]},"finishReason":"STOP"}],"usageMetadata":{...}}

data: {"candidates":[{"index":0,"content":{"role":"model","parts":[{"text":" world"}]},"finishReason":"STOP"}],"usageMetadata":{...}}
```

**Extraction**: `candidates[0].content.parts[0].text`

**Stream end**: Detected when the last chunk has no further parts.

**Embeddings**: `POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}`

---

### Ollama

**Endpoint**: `POST {ollama_url}/api/chat`

**Headers**: None (no authentication)

**Request Body**:
```json
{
  "model": "llama3.2",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}
```

**Streaming Format** (JSON lines — not standard SSE):

```json
{"model":"llama3.2","created_at":"...","message":{"role":"assistant","content":"Hello"},"done":false}
{"model":"llama3.2","created_at":"...","message":{"role":"assistant","content":" world"},"done":false}
{"model":"llama3.2","created_at":"...","message":{"role":"assistant","content":""},"done":true,"total_duration":...}
```

**Extraction**: `JSON.parse(line).message?.content || ''`

**Stream end**: Detected by `done: true` field.

**Embeddings**: `POST {ollama_url}/api/embed` with model `nomic-embed-text`.

---

## Error Handling

### Common Error Scenarios

| Scenario | Detection | User-Facing Message |
|----------|-----------|-------------------|
| Invalid API key | HTTP 401 | "Invalid API key. Check your settings." |
| Rate limited | HTTP 429 | "Rate limited. Please wait a moment." |
| Model unavailable | HTTP 404 | "Model not available." |
| Network error | fetch throws | "Network error. Check your connection." |
| Timeout | AbortController | "Request timed out." |
| Provider down | HTTP 5xx | "Provider error. Try again later." |

### Implementation

```typescript
async function streamProvider(model: string, messages: Message[], config: StreamConfig) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getHeaders(model),
      body: getBody(model, messages, config),
      signal: config.signal,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProviderError(
        error.error?.message || `HTTP ${response.status}`,
        response.status
      );
    }
    
    return response.body.getReader();
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if ((err as Error).name === 'AbortError') throw new AbortError();
    throw new NetworkError('Failed to connect to provider');
  }
}
```

### Retry Logic

Currently, Mosaic does **not** implement automatic retry. When a stream fails:
1. The streaming flag on the node is cleared
2. An error message is displayed on the node
3. The user can click a retry button to resend

Future versions may add exponential backoff retry for transient failures.

---

## AbortController Integration

Every streaming request is associated with an `AbortController`:

```typescript
const abortController = new AbortController();

// Pass to provider
const reader = await streamProvider(model, messages, {
  ...config,
  signal: abortController.signal,
});

// To stop mid-stream:
abortController.abort();
```

When aborted:
1. The fetch request is cancelled
2. The ReadableStream is released
3. The promise rejects with an `AbortError`
4. The hook catches this and does NOT show an error UI (it's intentional)
5. The user can continue the conversation from the partial response

---

## Embedding Provider Priority

The `embedTexts()` function (used by RAG) tries providers in order:

```typescript
async function embedTexts(texts: string[]): Promise<number[][]> {
  // Priority: Ollama → Mistral → OpenAI → Gemini
  const providers = [
    tryOllamaEmbed,
    tryMistralEmbed,
    tryOpenAIEmbed,
    tryGeminiEmbed,
  ];
  
  for (const tryProvider of providers) {
    try {
      return await tryProvider(texts);
    } catch {
      continue; // Try next provider
    }
  }
  
  throw new Error('No embedding provider available');
}
```

If all providers fail, `ragStore.searchChunks()` falls back to TF-IDF cosine similarity, which requires no external API.

---

## Provider Comparison

| Feature | Mistral | OpenAI | Anthropic | Gemini | Ollama |
|---------|---------|--------|-----------|--------|--------|
| Auth | Bearer | Bearer | x-api-key | URL param | None |
| Streaming | SSE | SSE | Event-based SSE | SSE | JSON lines |
| Embeddings | ✅ | ✅ | ❌ | ✅ | ✅ |
| Free tier | ✅ Credits | ❌ | ❌ | ✅ | ✅ (local) |
| Speed | Fast | Fast | Medium | Fast | Variable |
| Quality | High | High | Very High | High | Variable |

---

## Next Steps

- [[LLM Provider Integration]] — Configuration and usage guide
- [[RAG System Guide]] — How embeddings are used for document search
- [[Advanced AI Features]] — How streaming enables confidence scoring and tendrils
