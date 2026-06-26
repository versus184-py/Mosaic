# Utilities and Types Reference

This page documents Mosaic's utility functions, type definitions, and helper modules.

---

## Types (`src/types/index.ts`)

### Node Types

```typescript
type NodeType = 'root' | 'branch' | 'response' | 'suggestion' | 'distillation';
type EdgeType = 'liquidEdge' | 'tendrilEdge' | 'distillEdge';
```

### NodeData

```typescript
interface NodeData {
  label: string;
  nodeType: NodeType;
  collapsed?: boolean;
  bookmarked?: boolean;
  confidence?: number;       // 0-100, only for response nodes
  isStreaming?: boolean;
  error?: string;            // Error message if streaming failed
}
```

### EdgeData

```typescript
interface EdgeData {
  edgeType: EdgeType;
}
```

### CanvasData

```typescript
interface CanvasData {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
  bookmarkedIds?: string[];
}
```

### Provider Types (v0.3.0+)

```typescript
type ProviderId = 'mistral' | 'openai' | 'anthropic' | 'gemini' | 'ollama';

type ProviderType = ProviderId; // Alias for compatibility

interface ModelOption {
  id: string;                // Model identifier (e.g., 'mistral-large-latest', 'openai/gpt-4o')
  label: string;             // Display name (e.g., 'Mistral Large', 'GPT-4o')
  provider: ProviderId;
  supportsEmbeddings: boolean; // Whether this model can produce embeddings
}

interface ProviderDefinition {
  id: ProviderId;
  name: string;              // Human-readable name (e.g., 'Mistral AI')
  baseUrl: string;           // API base URL
  requiresKey: boolean;
  color: string;             // UI indicator color
}
```

### Built-in Models

The `BUILT_IN_MODELS` array in `src/api/config.ts` defines all statically known models:

```typescript
const BUILT_IN_MODELS: ModelOption[] = [
  { id: 'mistral-large-latest',     label: 'Mistral Large',     provider: 'mistral',  supportsEmbeddings: true },
  { id: 'mistral-small-latest',     label: 'Mistral Small',     provider: 'mistral',  supportsEmbeddings: true },
  { id: 'openai/gpt-4o',            label: 'GPT-4o',            provider: 'openai',   supportsEmbeddings: true },
  { id: 'openai/gpt-4o-mini',       label: 'GPT-4o Mini',       provider: 'openai',   supportsEmbeddings: true },
  { id: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'anthropic', supportsEmbeddings: false },
  { id: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5', provider: 'anthropic', supportsEmbeddings: false },
  { id: 'gemini/gemini-2.5-pro',    label: 'Gemini 2.5 Pro',    provider: 'gemini',   supportsEmbeddings: true },
  { id: 'gemini/gemini-2.5-flash',  label: 'Gemini 2.5 Flash',  provider: 'gemini',   supportsEmbeddings: true },
];
```

Ollama models are not in this list — they are dynamically detected at runtime via the Ollama API.

### RAG Types

```typescript
interface RagDocument {
  id: string;
  filename: string;
  size: number;              // File size in bytes
  chunks: RagChunk[];
}

interface RagChunk {
  id: string;
  text: string;
  embedding?: number[];      // Optional embedding vector
  metadata: {
    documentId: string;
    chunkIndex: number;
  };
}

interface RagSearchResult {
  chunk: RagChunk;
  score: number;             // Cosine similarity score (0-1)
}
```

### Analytics Types

```typescript
interface CanvasStats {
  totalTokens: number;
  totalCost: number;
  modelBreakdown: Record<string, {
    tokens: number;
    cost: number;
    count: number;
  }>;
  completions: Array<{
    model: string;
    tokens: number;
    cost: number;
    timestamp: number;
  }>;
}

interface NodeStats {
  totalNodes: number;
  branchNodes: number;
  responseNodes: number;
  rootNodes: number;
  totalMessages: number;
  depth: number;              // Maximum conversation tree depth
  branchCount: number;        // Number of branching points
}
```

### Glass UI Types

```typescript
type SurfaceProfile = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip';
type GlassVariant = 'regular' | 'clear';

interface LensParams {
  width: number;
  height: number;
  surface: SurfaceProfile;
  variant: GlassVariant;
  interactive?: boolean;
}

interface DisplacementMap {
  canvas: HTMLCanvasElement;
  scale: number;
  updatedAt: number;
}
```

### Toast Types

```typescript
interface Toast {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
}
```

### Prune Types

```typescript
interface PruneState {
  pruneActive: boolean;
  pruneGoal: string;
  isPruning: boolean;
}
```

---

## Code Runner (`src/utils/codeRunner.ts`)

The code runner manages a Web Worker for sandboxed code execution.

```typescript
interface CodeResult {
  output: string;             // stdout + returned value
  error?: string;             // Error message if execution failed
  executionTime?: number;     // Execution time in ms
}
```

### Functions

#### `runCode(lang: 'javascript' | 'python', code: string): Promise<CodeResult>`
Executes code in the sandboxed worker. Creates the worker on first call.

```typescript
import { runCode } from '@/utils/codeRunner';

const result = await runCode('javascript', 'console.log("Hello!")');
console.log(result.output); // "Hello!"
```

**Timeout**: 30 seconds. Throws on timeout.

#### `replExec(code: string): Promise<CodeResult>`
Executes code in the persistent Python REPL environment. Variables persist between calls.

```typescript
await replExec('x = 42');
const result = await replExec('print(x * 2)');
// result.output === "84"
```

#### `replReset(): Promise<void>`
Resets the Python REPL environment (clears all variables).

#### `terminateWorker(): void`
Terminates the Web Worker for cleanup. Called on component unmount.

### Worker Communication Protocol

```
Main Thread → Worker:    { exec_id: string, lang: string, code: string }
Worker → Main Thread:    { exec_id: string, type: 'stdout' | 'result' | 'error', data: string }
```

---

## Validation (`src/utils/validation.ts`)

```typescript
function validateNodeData(data: unknown): data is NodeData
function validateImportedCanvas(data: unknown): data is CanvasData
function validateCanvasData(data: unknown): data is CanvasData
function validateRagDocs(data: unknown): data is RagDocument[]
function validateUIState(data: unknown): data is { theme: string; temperature: number; [key: string]: unknown }
```

All validation functions:
1. Check that input is an object
2. Check required fields exist and have correct types
3. Return `true` if valid, `false` otherwise
4. Used by stores on `localStorage` load to prevent corrupted data from crashing the app

---

## Deep Clone (`src/utils/deepClone.ts`)

```typescript
function deepClone<T>(obj: T): T
```

Uses `structuredClone()` when available (modern browsers) with a manual JSON-based fallback. Used by the undo system to capture state snapshots.

---

## Auto-Layout (`src/utils/layout.ts`)

```typescript
interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}
```

```typescript
function autoLayout(nodes: Node[], edges: Edge[], startNodeId?: string): LayoutResult
```

**Algorithm**: BFS radial tree layout:
1. Find root node (or start node)
2. BFS traversal to determine tree depth and child relationships
3. Position root at center
4. Position children in concentric rings with angular spacing
5. Angular spacing = 2π / childCount at each level
6. Returns new positions for all nodes

---

## Encryption (`src/utils/encryption.ts`)

```typescript
const SALT = 'MosaicKeySalt';

function encrypt(text: string): string {
  // XOR each character with salt character (cycling)
  // Base64-encode the result
}

function decrypt(encoded: string): string {
  // Base64-decode
  // XOR each character with salt character (cycling)
}
```

Used for API key storage in localStorage. **Not production-grade encryption** — prevents casual exposure. API keys are decrypted for use and cached in memory.

---

## Provider Config (`src/api/config.ts`)

```typescript
const PROVIDER_DEFS: Record<ProviderId, ProviderDefinition> = {
  mistral:   { id: 'mistral',   name: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1',  requiresKey: true,  color: '#3B82F6' },
  openai:    { id: 'openai',    name: 'OpenAI',     baseUrl: 'https://api.openai.com/v1',   requiresKey: true,  color: '#22C55E' },
  anthropic: { id: 'anthropic', name: 'Anthropic',  baseUrl: 'https://api.anthropic.com/v1', requiresKey: true,  color: '#F97316' },
  gemini:    { id: 'gemini',    name: 'Gemini',     baseUrl: 'https://generativelanguage.googleapis.com/v1beta', requiresKey: true, color: '#EAB308' },
  ollama:    { id: 'ollama',    name: 'Ollama',     baseUrl: '',  requiresKey: false, color: '#A855F7' },
};
```

### API Key Storage

```typescript
// Store keys in localStorage with per-provider keys
const STORAGE_KEYS = {
  mistral: 'mosaic-api-key-mistral',
  openai: 'mosaic-api-key-openai',
  anthropic: 'mosaic-api-key-anthropic',
  gemini: 'mosaic-api-key-gemini',
};
// Ollama has no API key
```

Keys are XOR-encrypted before storage and decrypted on read. Cached in a runtime `Map<ProviderId, string>` for performance.

### API Key Storage

```typescript
// Store keys in localStorage
const STORAGE_KEYS = {
  mistral: 'mosaic-api-key-mistral',
  openai: 'mosaic-api-key-openai',
  anthropic: 'mosaic-api-key-anthropic',
  gemini: 'mosaic-api-key-gemini',
};
// Ollama has no API key
```

Keys are XOR-encrypted before storage and decrypted on read. Cached in a runtime Map for performance.

---

## Provider Router (`src/api/providers.ts`)

```typescript
function streamProvider(
  model: string,
  messages: Message[],
  config: StreamConfig
): Promise<ReadableStreamDefaultReader>

function embedTexts(texts: string[]): Promise<number[][]>
```

### StreamConfig

```typescript
interface StreamConfig {
  temperature?: number;
  systemPrompt?: string;
  signal?: AbortSignal;      // For cancellation
  onChunk?: (chunk: string) => void;  // Streaming callback
}
```

### Model Routing

| Model prefix pattern | Provider function |
|---------------------|-------------------|
| `mistral-*` | `streamMistral()` |
| `gpt-*` | `streamOpenAI()` |
| `claude-*` | `streamAnthropic()` |
| `gemini-*` | `streamGemini()` |
| anything else | `streamOllama()` |

---

## Constants

```typescript
// File size limits
const MAX_DOCUMENTS = 50;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;     // 50 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;       // 10 MB

// Chunking
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

// Undo
const MAX_UNDO_HISTORY = 50;

// Code execution
const EXECUTION_TIMEOUT = 30000;              // 30 seconds

// Pruning
const PRUNE_THRESHOLD = 40;

// Streaming
const CONFIDENCE_TIMEOUT = 8000;              // 8 seconds
const TENDRILL_AUTO_DISMISS = 30000;          // 30 seconds

// Analytics
const MAX_COMPLETIONS = 100;
const DEFAULT_TOKEN_RATE = 0.25;              // chars per token

// Pricing
const PRICING: Record<string, { input: number; output: number }> = {
  'mistral-large-latest': { input: 2.00, output: 6.00 },
  'mistral-small-latest': { input: 0.20, output: 0.60 },
  // Other models use defaults
};

// Canvas
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 3;
const SAVE_DEBOUNCE = 300;                    // ms
```

---

## Next Steps

- [[Store API Reference]] — All Zustand stores
- [[Hook API Reference]] — All custom hooks
- [[Code Sandbox Architecture]] — Deep dive into code execution
