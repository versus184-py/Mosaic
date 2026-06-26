# State Management and Persistence

Mosaic uses **Zustand v5** for all state management, with localStorage-based persistence for most stores. This page documents the architecture, persistence strategy, data validation, and design decisions behind the state layer.

---

## Store Architecture

### Store Overview

| Store | File | Persistence | localStorage Key | Size Estimate |
|-------|------|-------------|------------------|---------------|
| `canvasStore` | `store/canvasStore.ts` | Debounced save to canvasManagerStore | (via canvasManagerStore) | Per-canvas |
| `canvasManagerStore` | `store/canvasManagerStore.ts` | localStorage | `mosaic-canvases`, `mosaic-canvas-data-*` | Index: ~1KB; per-canvas: variable |
| `uiStore` | `store/uiStore.ts` | localStorage | `mosaic-ui` | ~2KB |
| `analyticsStore` | `store/analyticsStore.ts` | localStorage | `mosaic-analytics` | ~50KB (100 completions) |
| `ragStore` | `store/ragStore.ts` | localStorage | `mosaic-rag` | Variable (document chunks) |
| `toastStore` | `store/toastStore.ts` | In-memory | — | Negligible |
| `pruneStore` | `store/pruneStore.ts` | In-memory | — | Negligible |

### Why Zustand?

- **Minimal API**: No reducers, actions, or dispatch functions. State and actions are co-located in a single store definition.
- **Selective subscriptions**: Components only re-render when their specific slice of state changes, preventing unnecessary re-renders.
- **TypeScript inference**: Full type safety without additional type definitions for actions.
- **Persistence**: The `persist` middleware (or manual localStorage integration) handles persistence without extra libraries.
- **Bundle size**: ~2KB gzipped — negligible impact on app size.

---

## canvasStore Deep Dive

The canvas store is the most complex store. It manages the current canvas's nodes, edges, viewport, and position history.

### State Shape

```typescript
interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  activeNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  positionHistory: { nodes: Node[]; edges: Edge[] }[];
  bookmarkedIds: string[];
  currentNodeIndex: number;
}
```

### Position History (Undo)

The undo system uses a **ring buffer** with a maximum of 50 entries:

```typescript
const MAX_HISTORY = 50;

// Before each position update:
function captureSnapshot(state: CanvasState) {
  const snapshot = deepClone({ nodes: state.nodes, edges: state.edges });
  state.positionHistory.push(snapshot);
  if (state.positionHistory.length > MAX_HISTORY) {
    state.positionHistory.shift(); // Remove oldest
  }
}

// On undo:
function undo(state: CanvasState) {
  const snapshot = state.positionHistory.pop();
  if (snapshot) {
    state.nodes = snapshot.nodes;
    state.edges = snapshot.edges;
  }
}
```

The snapshots are created using `deepClone()` (from `src/utils/deepClone.ts`), which uses `structuredClone()` with a JSON-based fallback for environments that don't support it.

### Debounced Save

The canvas state is saved to `canvasManagerStore` with a **300ms debounce**:

```typescript
const saveTimeoutRef = { current: null as number | null };

function scheduleSave(state: CanvasState) {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  saveTimeoutRef.current = setTimeout(() => {
    flushSave();
  }, 300);
}

function flushSave() {
  const state = get();
  canvasManagerStore.getState().saveCanvasData(activeCanvasId, {
    nodes: state.nodes,
    edges: state.edges,
    viewport: state.viewport,
    bookmarkedIds: state.bookmarkedIds,
  });
}
```

This prevents excessive writes during rapid operations (e.g., dragging a node triggers many position updates, but only the final position is saved).

---

## canvasManagerStore Deep Dive

The canvas manager handles **multi-canvas tabs** — creating, deleting, renaming, switching, and duplicating canvases.

### Storage Layout

```
localStorage:
  mosaic-canvases: [
    { id: "canvas-1", name: "Research", createdAt: 1700000000000 },
    { id: "canvas-2", name: "Code Review", createdAt: 1700000100000 }
  ]
  
  mosaic-canvas-data-canvas-1: {
    nodes: [...],
    edges: [...],
    viewport: {...},
    bookmarkedIds: [...]
  }
  
  mosaic-canvas-data-canvas-2: {
    nodes: [...],
    edges: [...],
    viewport: {...},
    bookmarkedIds: [...]
  }
```

### Switch Canvas Flow

```
1. User clicks tab "canvas-2"
2. canvasManagerStore.switchCanvas("canvas-2")
3.    ├── Save current canvas data (canvas-1) to localStorage
4.    ├── Set activeCanvasId = "canvas-2"
5.    └── canvasStore.loadCanvas("canvas-2")
6.         └── Load data from localStorage mosaic-canvas-data-canvas-2
7.         └── Validate with validateCanvasData()
8.         └── Replace nodes, edges, viewport in canvasStore
```

### Duplicate Canvas

```
1. User clicks Duplicate
2. canvasManagerStore.duplicateCanvas("canvas-1")
3.    ├── Create new canvas ID "canvas-3"
4.    ├── Load canvas-1 data from localStorage
5.    ├── Save under canvas-3's key
6.    ├── Add "canvas-3 (copy)" to canvas list
7.    └── Switch to new canvas
```

---

## uiStore Deep Dive

The UI store manages application settings and UI state.

### Persistence Strategy

```typescript
// Subscribe to store changes and save to localStorage
uiStore.subscribe((state) => {
  const { settingsOpen, searchOpen, ...persistable } = state;
  localStorage.setItem('mosaic-ui', JSON.stringify(persistable));
});

// On initialization:
const stored = localStorage.getItem('mosaic-ui');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (validateUIState(parsed)) {
      uiStore.setState(parsed);
    }
  } catch {
    // Invalid data — use defaults
  }
}
```

Some state fields (like `settingsOpen`, `searchOpen`) are **transient** — they control UI visibility and shouldn't persist across sessions.

### Theme Application

```typescript
// In uiStore.setTheme():
setTheme: (theme) => {
  // Remove all theme classes
  document.documentElement.classList.remove('theme-void', 'theme-dusk',
    'theme-sand', 'theme-snow', 'theme-sunrise');
  // Add selected theme
  document.documentElement.classList.add(`theme-${theme}`);
  // Save to state
  set({ theme });
}
```

On initialization, the store detects OS theme preference:

```typescript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = prefersDark ? 'void' : 'sand';
```

---

## analyticsStore Deep Dive

### Token Estimation

Token count is estimated using a simple heuristic:

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);  // ~4 characters per token
}
```

This is an approximation. Actual token counts vary by model and tokenizer, but this provides a reasonable estimate for cost tracking.

### Cost Calculation

```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  'mistral-large-latest': { input: 2.00, output: 6.00 },  // Per 1M tokens
  'mistral-small-latest': { input: 0.20, output: 0.60 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing = PRICING[model] || { input: 0.50, output: 1.50 }; // Default fallback
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}
```

### Completion History

The last 100 completions are stored with timestamps:

```typescript
{
  completions: [
    {
      model: 'mistral-large-latest',
      tokens: 150,
      cost: 0.0009,
      timestamp: 1700000000000,
    },
    // ... up to 100 entries
  ]
}
```

When the array exceeds 100 entries, the oldest are trimmed.

---

## ragStore Deep Dive

### Document Limits

```typescript
const MAX_DOCUMENTS = 50;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;  // 50 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10 MB

function addDocument(doc: RagDocument): boolean {
  const state = get();
  
  if (state.documents.length >= MAX_DOCUMENTS) {
    throw new Error(`Maximum ${MAX_DOCUMENTS} documents allowed`);
  }
  
  const totalSize = state.documents.reduce((sum, d) => sum + d.size, 0);
  if (totalSize + doc.size > MAX_TOTAL_SIZE) {
    throw new Error('Total document size exceeds 50 MB limit');
  }
  
  set({ documents: [...state.documents, doc] });
  return true;
}
```

### Search Implementation

#### Embedding Search (Primary)

```typescript
async function searchChunks(query: string, topK = 3): Promise<RagChunk[]> {
  const state = get();
  if (!state.enabled || state.documents.length === 0) return [];
  
  const allChunks = state.documents.flatMap(d => d.chunks);
  if (allChunks.length === 0) return [];
  
  try {
    // Try embedding search
    const queryEmbedding = await embedTexts([query]);
    const scored = allChunks.map(chunk => ({
      chunk,
      score: cosineSimilarity(queryEmbedding[0], chunk.embedding),
    }));
    return scored.sort((a, b) => b.score - a.score)
                 .slice(0, topK)
                 .map(s => s.chunk);
  } catch {
    // Fallback to TF-IDF
    return tfidfSearch(query, allChunks, topK);
  }
}
```

#### TF-IDF Fallback

When embeddings are unavailable, TF-IDF cosine similarity is used:

```typescript
function tfidfSearch(query: string, chunks: RagChunk[], topK: number): RagChunk[] {
  // 1. Build vocabulary from all chunks + query
  const vocab = buildVocabulary([...chunks.map(c => c.text), query]);
  
  // 2. Compute TF-IDF vectors
  const queryVector = computeTfidfVector(query, vocab, chunks.length);
  const chunkVectors = chunks.map(c => computeTfidfVector(c.text, vocab, chunks.length));
  
  // 3. Compute cosine similarity
  const scored = chunkVectors.map((vec, i) => ({
    chunk: chunks[i],
    score: cosineSimilarity(queryVector, vec),
  }));
  
  // 4. Return top K
  return scored.sort((a, b) => b.score - a.score)
               .slice(0, topK)
               .map(s => s.chunk);
}
```

---

## Data Validation

All persisted data is validated on load to prevent corrupted data from crashing the app.

### Validation Functions

```typescript
// src/utils/validation.ts

function validateCanvasData(data: unknown): data is CanvasData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.nodes)) return false;
  if (!Array.isArray(d.edges)) return false;
  // Validate each node has required fields
  return d.nodes.every(n => validateNodeData(n.data));
}

function validateUIState(data: unknown): data is Partial<UIState> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.theme === 'string' &&
    typeof d.temperature === 'number' &&
    // ... other field checks
  );
}

function validateRagDocs(data: unknown): data is RagDocument[] {
  if (!Array.isArray(data)) return false;
  return data.every(doc =>
    typeof doc.id === 'string' &&
    typeof doc.filename === 'string' &&
    Array.isArray(doc.chunks)
  );
}
```

### Error Recovery

When validation fails, the store **resets to defaults**:

```typescript
// In store initialization:
const stored = localStorage.getItem('mosaic-ui');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (validateUIState(parsed)) {
      set(parsed);
    } else {
      console.warn('Invalid UI state in localStorage, using defaults');
      localStorage.removeItem('mosaic-ui');
    }
  } catch {
    localStorage.removeItem('mosaic-ui');
  }
}
```

---

## Performance Considerations

### Debounced Saves

- Canvas saves are debounced at 300ms
- This prevents multiple saves during rapid edits (e.g., typing in a node)
- `flushSave()` provides an immediate save when needed (e.g., before switching canvases)

### Selective Subscriptions

Zustand allows components to subscribe to specific slices of state:

```typescript
// Good: Only re-renders when theme changes
const theme = useUIStore(s => s.theme);

// Bad: Re-renders on ANY uiStore change
const state = useUIStore();
```

Mosaic's components use selective subscriptions throughout for optimal performance.

### localStorage Limits

localStorage typically has a 5-10 MB limit per origin. Mosaic's data fits comfortably within this:

- Canvas data: ~10-100 KB per canvas (varies with conversation size)
- Analytics: ~50 KB
- UI state: ~2 KB
- RAG documents: Variable (up to 50 MB on disk, but typically much less)

For very large canvases with extensive RAG documents, users may approach localStorage limits. Future versions may implement a Tauri command for file-based storage.

---

## Next Steps

- [[Store API Reference]]— Complete store API documentation
- [[Overall Architecture and Data Flow]] — How stores fit into the application
- [[Security Model]] — Data protection and validation
