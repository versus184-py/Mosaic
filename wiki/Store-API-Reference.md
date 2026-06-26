# Store API Reference

Mosaic uses **Zustand v5** for state management with seven stores. This page documents every store's state shape, actions, and persistence strategy.

---

## canvasStore

**File**: `src/store/canvasStore.ts`
**Persistence**: Debounced save (300ms) to `canvasManagerStore` per canvas

### State

```typescript
interface CanvasState {
  nodes: Node[];                          // React Flow nodes
  edges: Edge[];                          // React Flow edges
  activeNodeId: string | null;            // Currently selected node
  viewport: { x: number; y: number; zoom: number };  // Canvas viewport
  positionHistory: CanvasSnapshot[];      // Undo history (max 50)
  bookmarkedIds: string[];                // IDs of bookmarked nodes
  currentNodeIndex: number;               // Auto-incrementing node ID counter
}
```

### Actions

#### `addNode(parentId: string, label: string, nodeType: NodeData['nodeType']): string`
Creates a new node as a child of `parentId`. Automatically generates position based on existing children. Returns the new node's ID.

```typescript
const nodeId = canvasStore.getState().addNode('root-1', 'Hello world', 'branch');
```

#### `removeCascade(nodeId: string)`
Removes a node and **all its descendants**. Shows a confirmation dialog if the node has children. Root nodes cannot be deleted.

```typescript
canvasStore.getState().removeCascade('node-5');
```

#### `updateNode(nodeId: string, data: Partial<NodeData>)`
Updates a node's data fields (label, confidence, error state, etc.).

```typescript
canvasStore.getState().updateNode('node-5', { label: 'Updated message', confidence: 92 });
```

#### `updateNodePosition(nodeId: string, position: { x: number; y: number })`
Updates a node's position and captures a snapshot in `positionHistory` for undo.

```typescript
canvasStore.getState().updateNodePosition('node-5', { x: 100, y: 200 });
```

#### `undo()`
Pops the last position snapshot from `positionHistory` and restores nodes/edges.

```typescript
canvasStore.getState().undo();
```

#### `clearCanvas()`
Removes all nodes and edges except the root node. Captures undo snapshot.

#### `toggleCollapse(nodeId: string)`
Toggles the collapsed state of a node. When collapsed, descendant nodes are hidden.

#### `toggleBookmark(nodeId: string)`
Toggles the bookmarked state of a node. Adds/removes from `bookmarkedIds`.

#### `autoLayout(startNodeId?: string)`
Runs BFS radial tree auto-layout. If `startNodeId` is provided, layouts from that node; otherwise from root.

#### `getDescendantIds(nodeId: string): string[]`
Returns all descendant node IDs recursively. Used for cascade deletion.

#### `getConversationPath(nodeId: string): string[]`
Walks up parent edges to return the complete conversation path from root to the given node. Used for streaming context.

#### `importData(data: { nodes: Node[]; edges: Edge[] })`
Replaces all nodes and edges with imported data. Validates before importing.

#### `loadCanvas(canvasId: string)`
Loads a canvas's data from `canvasManagerStore`. Called when switching tabs.

#### `flushSave()`
Immediately saves the current canvas state to `canvasManagerStore` (bypasses debounce).

---

## canvasManagerStore

**File**: `src/store/canvasManagerStore.ts`
**Persistence**: localStorage (`mosaic-canvases`, `mosaic-canvas-data-*`)

### State

```typescript
interface CanvasManagerState {
  canvases: CanvasMeta[];        // Array of { id, name, createdAt }
  activeCanvasId: string | null; // Currently active canvas
}
```

### Actions

#### `createCanvas(name?: string): string`
Creates a new canvas with an optional name. Returns the new canvas ID.

#### `deleteCanvas(canvasId: string)`
Deletes a canvas and its stored data. Auto-switches to another canvas if the active one is deleted.

#### `renameCanvas(canvasId: string, name: string)`
Renames a canvas (double-click on tab to trigger).

#### `switchCanvas(canvasId: string)`
Switches to a different canvas. Saves current canvas state before switching.

#### `duplicateCanvas(canvasId: string): string`
Duplicates a canvas with all its data. Returns the new canvas ID.

#### `saveCanvasData(canvasId: string, data: CanvasData)`
Saves canvas data to localStorage. Key: `mosaic-canvas-data-{id}`.

#### `loadCanvasData(canvasId: string): CanvasData | null`
Loads canvas data from localStorage. Validates with `validateCanvasData` before returning.

---

## uiStore

**File**: `src/store/uiStore.ts`
**Persistence**: localStorage (`mosaic-ui`)

### State

```typescript
interface UIState {
  theme: 'void' | 'dusk' | 'sand' | 'snow' | 'sunrise';
  zoom: number;                          // Current zoom level
  showMiniMap: boolean;
  showWelcome: boolean;
  settingsOpen: boolean;
  systemPrompt: string;
  temperature: number;                   // 0.0 - 2.0
  model: string;                         // Selected model ID
  searchQuery: string;
  searchOpen: boolean;
  showBookmarksOnly: boolean;
  confidenceEnabled: boolean;
  tendrilsEnabled: boolean;
  debateModels: string[];               // Models for parallel debate
  ollamaConnected: boolean;
  ollamaModels: string[];
  ollamaUrl: string;
}
```

### Actions

Each state field has a corresponding setter:

```typescript
setTheme(theme: string): void
setZoom(zoom: number): void
setShowMiniMap(show: boolean): void
setSettingsOpen(open: boolean): void
setSystemPrompt(prompt: string): void
setTemperature(temp: number): void
setModel(model: string): void
setSearchQuery(query: string): void
setSearchOpen(open: boolean): void
setShowBookmarksOnly(show: boolean): void
setConfidenceEnabled(enabled: boolean): void
setTendrilsEnabled(enabled: boolean): void
setDebateModels(models: string[]): void
setOllamaConnected(connected: boolean): void
setOllamaModels(models: string[]): void
setOllamaUrl(url: string): void
```

### Computed (Getters)

#### `getSelectedModel(): { name: string; provider: string }`
Returns the full model info for the currently selected model.

#### `getAvailableModels(): ModelOption[]`
Returns all available models across all configured providers, including auto-detected Ollama models. Groups by provider with color indicators.

#### `getActiveProvider(): string`
Returns the provider name for the currently selected model.

#### `hasApiKeyForCurrent(): boolean`
Returns whether the API key is configured for the currently selected provider.

### Theme Application

When `setTheme()` is called, the store sets `document.documentElement.classList` to `theme-{name}`. On initialization, it auto-detects OS dark/light preference.

---

## analyticsStore

**File**: `src/store/analyticsStore.ts`
**Persistence**: localStorage (`mosaic-analytics`)

### State

```typescript
interface AnalyticsState {
  stats: Record<string, CanvasStats>;  // Keyed by canvas ID
}
```

### CanvasStats

```typescript
interface CanvasStats {
  totalTokens: number;
  totalCost: number;
  modelBreakdown: Record<string, ModelStats>;
  completions: CompletionRecord[];     // Last 100
}
```

```typescript
interface ModelStats {
  tokens: number;
  cost: number;
  count: number;
}
```

```typescript
interface CompletionRecord {
  model: string;
  tokens: number;
  cost: number;
  timestamp: number;
}
```

### Pricing Table (built-in)

```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  'mistral-large-latest':      { input: 2.00, output: 6.00 },
  'mistral-small-latest':      { input: 0.20, output: 0.60 },
  // Other models use sensible defaults
};
```

### Actions

#### `recordCompletion(canvasId: string, model: string, text: string)`
Records a completion event. Estimates tokens as `Math.ceil(text.length / 4)`. Calculates cost from pricing table.

```typescript
analyticsStore.getState().recordCompletion('canvas-1', 'mistral-large-latest', 'Hello world');
```

#### `computeNodeStats(canvasId: string, nodes: Node[], edges: Edge[]): NodeStats`
Computes canvas statistics from the current node/edge data:

```typescript
interface NodeStats {
  totalNodes: number;
  branchNodes: number;
  responseNodes: number;
  rootNodes: number;
  totalMessages: number;
  depth: number;          // Maximum tree depth
  branchCount: number;    // Number of branching points
}
```

#### `resetCanvasStats(canvasId: string)`
Resets all analytics for a given canvas.

---

## ragStore

**File**: `src/store/ragStore.ts`
**Persistence**: localStorage (`mosaic-rag`)

### State

```typescript
interface RAGState {
  documents: RagDocument[];
  enabled: boolean;
}
```

### RagDocument

```typescript
interface RagDocument {
  id: string;
  filename: string;
  size: number;
  chunks: RagChunk[];
}
```

```typescript
interface RagChunk {
  id: string;
  text: string;
  embedding?: number[];   // Optional embedding vector
  metadata: {
    documentId: string;
    chunkIndex: number;
  };
}
```

### Actions

#### `addDocument(doc: RagDocument)`
Adds a document. Enforces limits (50 docs, 50MB total, 10MB per file).

#### `removeDocument(documentId: string)`
Removes a document and all its chunks.

#### `clearDocuments()`
Removes all documents.

#### `setEnabled(enabled: boolean)`
Toggles RAG on/off.

#### `searchChunks(query: string, topK?: number): RagChunk[]`
Searches for the most relevant chunks. Uses embedding cosine similarity if available, otherwise TF-IDF cosine similarity. Returns `topK` chunks (default 3).

---

## toastStore

**File**: `src/store/toastStore.ts`
**Persistence**: In-memory only (not persisted)

### State

```typescript
interface ToastState {
  toasts: Toast[];
}
```

```typescript
interface Toast {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
}
```

### Actions

#### `addToast(type: Toast['type'], message: string)`
Adds a toast notification. Auto-dismisses after animation.

#### `removeToast(id: string)`
Manually removes a toast.

---

## pruneStore

**File**: `src/store/pruneStore.ts`
**Persistence**: In-memory only (transient)

### State

```typescript
interface PruneState {
  pruneActive: boolean;
  pruneGoal: string;
  isPruning: boolean;
}
```

### Actions

```typescript
setPruneActive(active: boolean): void
setPruneGoal(goal: string): void
setIsPruning(pruning: boolean): void
```

This store is intentionally simple — it only tracks the current pruning operation's state. The actual pruning logic (scoring branches) lives in `useBranchPruning` hook.

---

## Store Dependency Graph

```
canvasManagerStore (persistent)
    │
    ├── canvasStore (debounced save → canvasManagerStore)
    │
uiStore (persistent, independent)
    │
analyticsStore (persistent, independent)
    │
ragStore (persistent, independent)
    │
toastStore (transient, independent)
    │
pruneStore (transient, independent)
```

Stores are independent — they do not subscribe to each other. Cross-store communication happens at the component/hook level (e.g., `useStreamMessage` reads from `ragStore` and writes to `canvasStore` and `analyticsStore`).

---

## Persistence Details

| Store | localStorage Key | Serialization | Validation |
|-------|-----------------|---------------|------------|
| canvasManager | `mosaic-canvases` | JSON | `validateCanvasData` |
| canvas data | `mosaic-canvas-data-{id}` | JSON | `validateCanvasData` |
| uiStore | `mosaic-ui` | JSON | `validateUIState` |
| analyticsStore | `mosaic-analytics` | JSON | None |
| ragStore | `mosaic-rag` | JSON | `validateRagDocs` |

All persisted stores validate their data on load using the validation utilities in `src/utils/validation.ts`. Invalid data is reset to defaults.

---

## Next Steps

- [[Hook API Reference]] — All custom hooks with parameters and return types
- [[Component API Reference]] — All component props and usage
- [[State Management and Persistence]] — Architecture deep-dive
