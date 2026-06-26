# Hook API Reference

Mosaic uses custom React hooks to encapsulate complex logic. This page documents every hook's parameters, return values, and behavior.

---

## useStreamMessage

**File**: `src/hooks/useStreamMessage.ts`
**Purpose**: Core streaming hook. Sends a message to the AI provider, streams the response into a node, and triggers post-processing (confidence, tendrils, analytics).

### Parameters

```typescript
function useStreamMessage(): {
  sendMessage: (params: SendMessageParams) => Promise<void>;
  stopStreaming: () => void;
  isStreaming: boolean;
}
```

### SendMessageParams

```typescript
interface SendMessageParams {
  parentNodeId: string;    // The node to reply to
  text: string;            // The user's message
  model?: string;          // Override the selected model
  debate?: boolean;        // If true, triggers parallel debate instead
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `sendMessage` | `(params) => Promise<void>` | Sends a message and streams the response |
| `stopStreaming` | `() => void` | Aborts the current streaming request |
| `isStreaming` | `boolean` | True while a streaming response is in progress |

### Internal Flow

When `sendMessage` is called:

1. **Create branch node**: Adds a `branch` node for the user's message
2. **Build conversation path**: Walks up parent edges via `getConversationPath()` to build message history
3. **Check RAG context**: If RAG is enabled, calls `ragStore.searchChunks()` for top 3 chunks (with optional query embedding from `embedTexts()`)
4. **Inject context**: Appends RAG context to the system prompt
5. **Send to provider**: Calls `streamProvider()` which returns an `AsyncGenerator<string>`. The hook iterates with `for await...of` to receive text chunks.
6. **Stream chunks**: Each chunk updates the response node's label incrementally
7. **Post-processing**: 
   - Calls `useConfidenceScore` (if enabled) to score the response
   - Calls `useSuggestionTendrils` (if enabled) to generate follow-ups
   - Calls `analyticsStore.recordCompletion()` to track usage
8. **Error handling**: If streaming fails, sets `error` field on the response node

### Usage

```typescript
const { sendMessage, stopStreaming, isStreaming } = useStreamMessage();

// Send a message
await sendMessage({ parentNodeId: 'node-1', text: 'Hello!' });

// Stop streaming mid-response
stopStreaming();

// Parallel debate
await sendMessage({ parentNodeId: 'node-1', text: 'Compare approaches', debate: true });

// Override model
await sendMessage({ parentNodeId: 'node-1', text: 'Explain', model: 'gpt-4o' });
```

---

## useConfidenceScore

**File**: `src/hooks/useConfidenceScore.ts`
**Purpose**: After a response completes, asks the AI to self-score its response (0-100).

### Parameters

```typescript
function useConfidenceScore(): {
  scoreResponse: (nodeId: string, text: string, model: string) => Promise<void>;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `scoreResponse` | `(nodeId, text, model) => Promise<void>` | Sends calibration prompt and updates node with score |

### Calibration Prompt

```
Rate the confidence of your previous response on a scale of 0-100.
Consider: factual accuracy, clarity, completeness, and how well it addressed the user's question.
Respond with ONLY a number between 0 and 100.
```

### Behavior

- **Timeout**: 8 seconds (AbortController)
- **Failure mode**: Silent — no error thrown, node simply won't have a confidence badge
- **Updates**: Sets the `confidence` field on the response node via `updateNode()`

### Usage

```typescript
const { scoreResponse } = useConfidenceScore();
await scoreResponse('node-5', 'The full response text...', 'mistral-large-latest');
```

---

## useSuggestionTendrils

**File**: `src/hooks/useSuggestionTendrils.ts`
**Purpose**: Generates 3 follow-up suggestion nodes after an AI response.

### Parameters

```typescript
function useSuggestionTendrils(): {
  generateTendrils: (nodeId: string, conversationPath: string[], model: string) => Promise<void>;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `generateTendrils` | `(nodeId, conversationPath, model) => Promise<void>` | Generates 3 suggestions and spawns suggestion nodes |

### Generation Prompt

```
Based on our conversation, suggest 3 follow-up questions the user might want to ask next.
Return them as a JSON array of strings: ["question1", "question2", "question3"]
```

### Behavior

- Creates 3 `suggestion` type nodes connected via `tendrilEdge`
- Sets a 30-second auto-dismiss timer (setTimeout)
- Each suggestion node has click handler for materialization
- If user clicks a suggestion, its text is copied to the parent node's input and the suggestion node is removed

### Usage

```typescript
const { generateTendrils } = useSuggestionTendrils();
await generateTendrils('node-5', ['msg1', 'msg2', 'msg3'], 'mistral-large-latest');
```

---

## useBranchPruning

**File**: `src/hooks/useBranchPruning.ts`
**Purpose**: Scores leaf branches for relevance to a user-provided goal and dims low-scoring branches.

### Parameters

```typescript
function useBranchPruning(): {
  pruneBranches: (goal: string) => Promise<void>;
  clearPrune: () => void;
  isPruning: boolean;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `pruneBranches` | `(goal) => Promise<void>` | Scores all branches against goal |
| `clearPrune` | `() => void` | Restores all pruned branches |
| `isPruning` | `boolean` | True while pruning is in progress |

### Scoring Logic

1. Collects all leaf nodes (nodes with no children)
2. For each leaf, builds the conversation path
3. Sends path content to AI with scoring prompt
4. Parses numeric score from response (0-100)
5. Branches with score < 40 get `pruned: true` (configurable threshold)
6. Updates `pruneStore` state

### Usage

```typescript
const { pruneBranches, clearPrune, isPruning } = useBranchPruning();
await pruneBranches('I need to decide on a database for high-traffic web app');
clearPrune(); // Restore all
```

---

## useDistillation

**File**: `src/hooks/useDistillation.ts`
**Purpose**: Summarizes all leaf branches into a single distillation node.

### Parameters

```typescript
function useDistillation(): {
  distill: () => Promise<void>;
  isDistilling: boolean;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `distill` | `() => Promise<void>` | Collects leaves, sends for synthesis, creates distillation node |
| `isDistilling` | `boolean` | True while distillation is in progress |

### Behavior

1. Collects all leaf nodes (BFS traversal)
2. For each leaf, retrieves conversation path via `getConversationPath()`
3. Constructs a synthesis prompt with all leaf content
4. Streams the AI response into a new `distillation` type node
5. Creates gold `distillEdge` connections from distillation node to each source leaf
6. Positions distillation node at the bottom-center of the viewport

### Usage

```typescript
const { distill, isDistilling } = useDistillation();
await distill();
```

---

## useParallelDebate

**File**: `src/hooks/useParallelDebate.ts`
**Purpose**: Sends the same input to multiple models simultaneously and displays all responses.

### Parameters

```typescript
function useParallelDebate(): {
  debate: (params: DebateParams) => Promise<void>;
  isDebating: boolean;
}
```

```typescript
interface DebateParams {
  parentNodeId: string;
  text: string;
  models: string[];  // Models to use (from uiStore.debateModels)
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `debate` | `(params) => Promise<void>` | Fans out requests to all models |
| `isDebating` | `boolean` | True while debate is in progress |

### Behavior

1. Creates one `branch` node for the user message
2. Fans out `streamProvider()` calls via `Promise.allSettled()`
3. Each model's response streams into its own `response` node
4. Response nodes are positioned in a fan layout (angular spread)
5. Failed models don't affect successful ones (allSettled)

### Usage

```typescript
const { debate, isDebating } = useParallelDebate();
await debate({
  parentNodeId: 'node-1',
  text: 'Compare databases',
  models: ['mistral-large-latest', 'gpt-4o', 'claude-sonnet-4-20250514']
});
```

---

## useDocumentParser

**File**: `src/hooks/useDocumentParser.ts`
**Purpose**: Parses uploaded text/code files into chunks for RAG.

### Parameters

```typescript
function useDocumentParser(): {
  parseDocument: (file: File) => Promise<RagDocument | null>;
  isParsing: boolean;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `parseDocument` | `(file) => Promise<RagDocument \| null>` | Reads file, chunks text, returns RagDocument |
| `isParsing` | `boolean` | True while parsing |

### Chunking Algorithm

```typescript
const CHUNK_SIZE = 800;    // Characters per chunk
const CHUNK_OVERLAP = 100;  // Character overlap between chunks
```

1. Read file as text (FileReader)
2. Split text into chunks of CHUNK_SIZE with CHUNK_OVERLAP overlap
3. Each chunk gets a unique ID and metadata (documentId, chunkIndex)
4. Returns RagDocument with all chunks

### Supported Formats

25+ file extensions: `.txt`, `.md`, `.json`, `.csv`, `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.rs`, `.go`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.css`, `.html`, `.xml`, `.yaml`, `.yml`, `.toml`, `.pdf`

### Usage

```typescript
const { parseDocument, isParsing } = useDocumentParser();
const doc = await parseDocument(fileInput.files[0]);
if (doc) {
  ragStore.getState().addDocument(doc);
}
```

---

## useOllamaDetect

**File**: `src/hooks/useOllamaDetect.ts`
**Purpose**: Detects Ollama connection and lists available models.

### Parameters

```typescript
function useOllamaDetect(): {
  checking: boolean;
  retry: () => Promise<void>;
  connected: boolean;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `checking` | `boolean` | True while detection is in progress |
| `retry` | `() => Promise<void>` | Manually trigger re-detection |
| `connected` | `boolean` | Current connection state from uiStore |

### Behavior

1. On mount, polls Ollama API at `uiStore.ollamaUrl` (default `http://localhost:11434`)
2. Calls `checkOllamaConnection()` — if reachable, calls `listOllamaModels()`
3. Updates `uiStore.ollamaConnected` and `uiStore.ollamaModels`
4. Runs automatically on app mount via `App.tsx` — no manual triggering needed

### Usage

```typescript
const { checking, retry, connected } = useOllamaDetect();
// Auto-detects on mount — retry() for manual re-check
```

---

## useSpeechRecognition

**File**: `src/hooks/useSpeechRecognition.ts`
**Purpose**: Wraps the Web Speech API for voice input.

### Parameters

```typescript
function useSpeechRecognition(): {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  supported: boolean;
}
```

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `transcript` | `string` | Current speech transcription |
| `isListening` | `boolean` | True while microphone is active |
| `error` | `string \| null` | Error message (if any) |
| `startListening` | `() => void` | Start speech recognition |
| `stopListening` | `() => void` | Stop speech recognition |
| `supported` | `boolean` | True if browser supports Web Speech API |

### Usage

```typescript
const { transcript, isListening, startListening, stopListening, supported } = useSpeechRecognition();

return (
  <div>
    <button onClick={startListening} disabled={!supported || isListening}>
      🎤 {isListening ? 'Listening...' : 'Start'}
    </button>
    <button onClick={stopListening}>Stop</button>
    <p>Transcript: {transcript}</p>
  </div>
);
```

## Hook Lifecycle and Side Effects

Understanding when hooks fire and what side effects they trigger is important for debugging and extending Mosaic.

### useStreamMessage Lifecycle

```
1. User presses Enter
2. sendMessage({ parentNodeId, text }) called
3.   → Create branch node (side effect: canvasStore mutation)
4.   → Set isStreaming = true
5.   → Build conversation path (getConversationPath up the tree)
6.   → If RAG enabled: searchChunks(query) (side effect: API call)
7.   → Send to streamProvider(model, messages, config)
8.     → For each chunk: updateNode(nodeId, { label: label + chunk })
9.       → (side effect: canvasStore mutation → React Flow re-render)
10.  → Stream complete
11.  → Set isStreaming = false
12.  → Parallel side effects (Promise.all):
13.    → useConfidenceScore.scoreResponse() (if enabled)
14.    → useSuggestionTendrils.generateTendrils() (if enabled)
15.    → analyticsStore.recordCompletion()
16.  → Debounced save to canvasManagerStore
```

### Error States and Recovery

| Hook | Error State | Recovery |
|------|-------------|----------|
| useStreamMessage | Node shows error message + retry button | Click retry → re-sends message |
| useConfidenceScore | No badge shown (silent) | Next response re-attempts |
| useSuggestionTendrils | No suggestion nodes created (silent) | Next response re-attempts |
| useBranchPruning | Partial results (some branches scored) | Retry pruning |
| useDistillation | No distillation node created | Retry distillation |
| useParallelDebate | Failed models show error; successful models shown | Retry individual failed branches |
| useDocumentParser | File rejected with error message | Fix file and re-upload |
| useOllamaDetect | Ollama option grayed out | Click "Detect" to retry |
| useSpeechRecognition | Error message shown | Click mic again |

### Performance Considerations

| Hook | Computation Cost | Network Cost | When to Optimize |
|------|-----------------|-------------|------------------|
| useStreamMessage | Low (concatenation) | High (full streaming) | Large conversation history |
| useConfidenceScore | Low | Medium (one completion) | High-volume use (disable if not needed) |
| useSuggestionTendrils | Low | Medium (one completion) | High-volume use (disable if not needed) |
| useBranchPruning | Low | High (one completion per leaf) | Large canvases (many leaves) |
| useDistillation | Low | High (large context) | Very large canvases |
| useParallelDebate | Low | Very High (N completions) | Many models selected |
| useDocumentParser | Medium (chunking) | None | Large files (many chunks) |

---

## Hook Dependency Graph

```
useStreamMessage
  ├── useConfidenceScore (called after stream completes)
  ├── useSuggestionTendrils (called after stream completes)
  └── analyticsStore.recordCompletion (called after stream completes)

useParallelDebate
  └── useStreamMessage (multiple parallel calls)

useBranchPruning
  └── streamProvider (for each leaf branch)

useDistillation
  └── streamProvider (for synthesis)
```

---

## Next Steps

- [[Store API Reference]] — All stores with state and actions
- [[Component API Reference]] — All components with props
- [[Utilities and Types Reference]] — Utility functions and type definitions
