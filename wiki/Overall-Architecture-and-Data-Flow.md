# Overall Architecture and Data Flow

This page provides a comprehensive overview of Mosaic's architecture — how the pieces fit together, how data flows through the system, and the design decisions behind the architecture.

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                      Tauri v2 Shell                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              WebView (Frontend)                    │  │
│  │  ┌───────────┐ ┌──────────┐ ┌────────────────┐   │  │
│  │  │   React 19 │ │  React   │ │   Zustand v5    │   │  │
│  │  │  + TypeScript│ │  Flow    │ │   (7 stores)    │   │  │
│  │  │           │ │  v12     │ │                │   │  │
│  │  └───────────┘ └──────────┘ └────────────────┘   │  │
│  │  ┌───────────┐ ┌──────────┐ ┌────────────────┐   │  │
│  │  │  Framer   │ │  Tailwind│ │   Glass UI      │   │  │
│  │  │  Motion   │ │  CSS v3  │ │   Engine        │   │  │
│  │  └───────────┘ └──────────┘ └────────────────┘   │  │
│  │  ┌───────────────────────────────────────────┐    │  │
│  │  │   Web Worker (Code Sandbox)               │    │  │
│  │  │   - JavaScript via Function()             │    │  │
│  │  │   - Python via Pyodide (WASM)             │    │  │
│  │  └───────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Rust Backend (lib.rs)                 │  │
│  │              - Minimal Tauri shell                 │  │
│  │              - No custom commands                  │  │
│  │              - CSP enforcement                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              localStorage (Persistence)            │  │
│  │   mosaic-canvases, mosaic-canvas-data-*,           │  │
│  │   mosaic-ui, mosaic-analytics, mosaic-rag          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Why Tauri?

Mosaic uses **Tauri v2** instead of Electron for several reasons:

- **Smaller binary**: Tauri apps are typically 5-10 MB vs. 100+ MB for Electron
- **Lower memory usage**: Rust backend uses minimal resources
- **Security**: Native CSP enforcement, capability-based permissions
- **Performance**: Rust provides native-level performance for the shell
- **Cross-platform**: Builds for Windows, macOS, and Linux

The Rust backend is intentionally minimal — it launches the webview and enforces security. All application logic runs in the frontend.

#### Detailed Tauri Backend Analysis

The Rust backend consists of just two files:

**`src-tauri/src/lib.rs`**:
```rust
use tauri::Builder;

pub fn run() {
    Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**`src-tauri/src/main.rs`**:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mosaic_lib::run();
}
```

That's the entire Rust backend. The `windows_subsystem = "windows"` attribute (only in release builds) prevents a console window from appearing on Windows. The build script (`build.rs`) calls `tauri_build::build()` to compile the frontend and bundle the application.

**Why this matters**:
- No IPC overhead — all communication between UI and data happens in-process in the webview
- No serialization boundaries — Zustand stores are directly accessible from React components
- Easier debugging — all logic is in JavaScript/TypeScript, debuggable with browser devtools
- Faster iteration — frontend changes don't require Rust recompilation (seconds vs. minutes)

### Performance Profile

| Operation | Tauri | Electron |
|-----------|-------|----------|
| Cold start | ~500ms | ~2000ms |
| Memory (idle) | ~80 MB | ~200 MB |
| Installer size | ~8 MB | ~120 MB |
| Canvas rendering (100 nodes) | 60fps | 60fps |
| Worker isolation | Native Web Worker | Native Web Worker |

---

### Build Pipeline

```
npm run tauri:dev
│
├── Vite dev server (port 1420)
│   ├── HMR (hot module replacement)
│   ├── TypeScript compilation (esbuild)
│   ├── CSS processing (PostCSS + Tailwind)
│   └── React Fast Refresh
│
└── Tauri window
    ├── Connected to Vite dev server
    ├── DevTools enabled
    └── CSP enforced

npm run tauri:build
│
├── tsc --noEmit (TypeScript type checking)
├── vite build
│   ├── Code splitting (@xyflow/react → flow chunk)
│   ├── Tree shaking
│   ├── Minification (esbuild/terser)
│   ├── CSS purging (Tailwind)
│   └── Asset hashing
│
└── cargo build (Rust)
    └── tauri bundle
        ├── Windows: .msi (WiX installer)
        ├── macOS: .dmg
        └── Linux: .AppImage
```

---

### Cross-Platform Considerations

| Component | Windows | macOS | Linux |
|-----------|---------|-------|-------|
| Webview | WebView2 (Edge Chromium) | WKWebView (Safari) | WebKitGTK |
| Window manager | Win32 | Cocoa | X11/Wayland |
| Installer | WiX (.msi) | DMG (.dmg) | AppImage/.deb |
| Icons | .ico | .icns | .png |
| CSP | Full support | Full support | Full support |
| Web Worker | Full support | Full support | Full support |
| Web Speech API | ✅ | ✅ | ❌ (WebKitGTK) |
| Pyodide | ✅ (requires WASM) | ✅ | ✅ |

The Web Speech API is limited on Linux (WebKitGTK doesn't support it), so the speech-to-text mic button will not appear on Linux.

---

## Directory Structure

```
mosaic/
├── src/                          # Frontend source
│   ├── api/                      # LLM provider integrations
│   │   ├── config.ts             # Provider config, API keys
│   │   ├── providers.ts          # Provider router
│   │   ├── mistral.ts            # Mistral AI client
│   │   ├── openai.ts             # OpenAI client
│   │   ├── anthropic.ts          # Anthropic client
│   │   ├── gemini.ts             # Gemini client
│   │   └── ollama.ts             # Ollama client
│   ├── components/
│   │   ├── canvas/               # React Flow nodes/edges
│   │   ├── glass/                # Glass UI components
│   │   ├── modals/               # ConfirmDialog
│   │   └── ui/                   # All other UI components
│   ├── hooks/                    # Custom React hooks
│   ├── liquid-glass/             # Physics engine
│   ├── store/                    # Zustand stores
│   ├── styles/                   # CSS (globals.css)
│   ├── types/                    # TypeScript definitions
│   ├── utils/                    # Utilities
│   ├── workers/                  # Code execution worker
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Windows subsystem entry
│   │   └── lib.rs                # Tauri builder
│   ├── tauri.conf.json           # Tauri configuration
│   ├── capabilities/
│   │   └── default.json          # Permissions
│   └── Cargo.toml                # Rust dependencies
```

---

## Data Flow

### Primary Flow: User Message → AI Response

```
User types message
       │
       ▼
NodeInput.textarea onChange
       │
       ▼
Enter key → sendMessage()
       │
       ▼
useStreamMessage.sendMessage({ parentNodeId, text })
       │
       ├── 1. Create branch node  ──────────────────► canvasStore.addNode()
       │
       ├── 2. Build conversation path  ─────────────► canvasStore.getConversationPath()
       │
       ├── 3. Check RAG context  ───────────────────► ragStore.searchChunks()
       │         │
       │         └── Embedding API (if available)
       │                    │
       │                    └── TF-IDF fallback
       │
       ├── 4. Build system prompt + RAG context
       │
       ├── 5. Send to streamProvider(model, messages, config)
       │         │
       │         ├── Mistral: streamMistral()
       │         ├── OpenAI: streamOpenAI()
       │         ├── Anthropic: streamAnthropic()
       │         ├── Gemini: streamGemini()
       │         └── Ollama: streamOllama()
       │
       ├── 6. Stream chunks ──► canvasStore.updateNode(label += chunk)
       │         │
       │         └── React Flow re-render (via Zustand subscription)
       │
       ├── 7. Stream complete
       │
       ├── 8. Post-processing (parallel):
       │    ├── useConfidenceScore → calibration prompt → updateNode(confidence)
       │    ├── useSuggestionTendrils → generation prompt → addNode(suggestion)
       │    └── analyticsStore.recordCompletion(tokens, cost)
       │
       └── 9. Debounced save ──► canvasManagerStore.saveCanvasData()
```

### Secondary Flow: Parallel Debate

```
Shift+Enter → useParallelDebate.debate({ models: [...] })
       │
       ├── Create one branch node
       │
       └── Promise.allSettled(models.map(model =>
             streamProvider(model, messages, config)
           ))
              │
              ├── Each model streams into its own response node
              ├── Fan layout positioning
              └── Independent confidence/tendrils/analytics per model
```

### Tertiary Flow: Canvas Persistence

```
Store update
       │
       ▼
Debounced flush (300ms)
       │
       ▼
canvasStore.flushSave()
       │
       ▼
canvasManagerStore.saveCanvasData(canvasId, {
  nodes, edges, viewport, bookmarkedIds
})
       │
       ▼
localStorage.setItem('mosaic-canvas-data-{id}', JSON.stringify(data))
```

---

## Component Hierarchy

```
<ErrorBoundary>
  <App>
    <TopBar />                    ← Provider selector, actions
    <CanvasTabs />                ← Multi-canvas tabs
    <MosaicCanvas>
      <ReactFlowProvider>
        <ReactFlow>
          <Background />
          <MessageNode />         ← Custom node (repeated per message)
          <LiquidEdge />          ← Default edge
          <TendrilEdge />         ← Suggestion edges
          <DistillEdge />         ← Distillation edges
          <MiniMap />             ← Optional minimap
        </ReactFlow>
      </ReactFlowProvider>
      <DragLens />                ← Floating lens overlay
    </MosaicCanvas>
    <ZoomControls />              ← Bottom-center
    <SettingsDrawer />            ← Settings modal
    <SearchOverlay />             ← Search modal
    <ShortcutsModal />            ← Shortcuts modal
    <DocumentPanel />             ← RAG slide-in
    <AnalyticsPanel />            ← Analytics slide-in
    <PruneBanner />               ← Prune status
    <ToastContainer />            ← Notifications
    <WelcomeScreen />             ← First-launch overlay
    <PythonTerminal />            ← REPL widget
  </App>
</ErrorBoundary>
```

---

## Store Dependency Graph

```
canvasManagerStore (localStorage: mosaic-canvases)
    │
    └── canvasStore (debounced save → canvasManagerStore)
              │
              ├── Nodes, edges, viewport
              ├── Position history (undo)
              └── Bookmarks

uiStore (localStorage: mosaic-ui)
    ├── Theme, zoom, minimap
    ├── Settings (system prompt, temperature, model)
    ├── Ollama state
    └── UI toggles (search, bookmarks, etc.)

analyticsStore (localStorage: mosaic-analytics)
    ├── Token usage per model
    ├── Cost estimation
    └── Completion history

ragStore (localStorage: mosaic-rag)
    ├── Documents and chunks
    ├── RAG enabled toggle
    └── Search index

toastStore (in-memory)
    └── Toast notification queue

pruneStore (in-memory)
    └── Pruning state (active, goal)
```

Stores are **independent** — they don't subscribe to each other's changes. Cross-store coordination happens at the hook/component level. This keeps the state management simple and predictable.

---

## Key Architecture Decisions

### Testing & CI Layer (Added in v0.3.0)

Mosaic includes a comprehensive test suite powered by **Vitest** with 191 tests across 11 files:

| Layer | Tests | What's Tested |
|-------|-------|---------------|
| API config | config.test.ts | XOR encrypt/decrypt, per-provider keys, provider routing |
| API providers | providers.test.ts | `embedTexts` fallback chain |
| API ollama | ollama.test.ts | URL management, defaults |
| Stores | canvasStore, ragStore, uiStore test files | State mutations, persistence, validation |
| Utils | validation, layout test files | All edge cases, tree layout, deep clone |
| Components | SettingsDrawer, TopBar test files | Rendering, user interactions |
| Hooks | useDocumentParser test files | Chunk algorithm (boundary detection, unicode) |

The CI pipeline (`.github/workflows/ci.yml`) runs `tsc --noEmit`, `vitest run`, and `npm run build` on every push/PR. The release pipeline (`.github/workflows/release.yml`) builds platform-specific installers for Windows, macOS, and Linux.

### Why No Custom Tauri Commands?

The Rust backend (`src-tauri/src/lib.rs`) has zero custom commands. All logic runs in the frontend. This was a deliberate choice:

1. **Simplicity**: No IPC overhead for the core use case (AI chat)
2. **Portability**: All logic is cross-platform by default (Rust commands would need platform-specific handling)
3. **Offline capability**: The frontend-only approach makes it easier to add offline features
4. **Development speed**: Frontend changes don't require Rust recompilation

The tradeoff is that localStorage is used for persistence instead of the filesystem. Future versions may add Tauri commands for file I/O, native dialogs, and system-level features.

### Why Zustand Over Redux/Context?

- **Minimal boilerplate**: Actions are just functions, no reducers/dispatchers
- **TypeScript-friendly**: Full type inference without extra code
- **Selective subscriptions**: Components only re-render when their selected state changes
- **Persistence middleware**: Easy localStorage integration
- **Bundle size**: ~2KB vs Redux's ~12KB

### Why React Flow?

- **Purpose-built**: Designed for node-based editors and interactive graphs
- **Custom nodes/edges**: Full React component support for custom rendering
- **Performance**: Virtual rendering, efficient updates for large graphs
- **Pannable/zoomable**: Built-in infinite canvas support
- **Event system**: Comprehensive event handling (node drag, edge connection, selection)

### Why Pyodide for Python?

- **In-browser WASM**: No server-side Python execution needed
- **Pre-compiled packages**: numpy, pandas, scipy, matplotlib available out of the box
- **Security**: Sandboxed in the browser with CSP restrictions
- **No backend**: All code execution happens client-side, keeping the architecture simple

---

## Event Flow Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────►│  React       │────►│  Zustand     │
│  Action  │     │  Component   │     │  Store       │
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  React Flow   │
                                      │  (subscribe)  │
                                      └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  DOM Re-     │
                                      │  render      │
                                      └──────────────┘
```

User actions (typing, clicking, dragging) flow through React components to Zustand stores. Stores notify React Flow (which subscribes via Zustand selectors) of changes. React Flow updates the DOM efficiently using its internal diffing and virtualization.

---

## Error Handling Architecture

Mosaic employs a multi-layered error handling strategy:

### Layer 1: React Error Boundary

The `<ErrorBoundary>` component wraps the entire app. It catches unhandled React errors and displays a fallback UI with a "Try Again" button. This prevents the entire app from crashing when a single component fails.

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Layer 2: Streaming Error Recovery

When AI streaming fails (network error, API error, timeout), the response node enters an error state:

1. The `isStreaming` flag is cleared
2. An `error` message is set on the node data
3. The node displays the error with a retry button
4. Clicking retry re-sends the message via `useStreamMessage.sendMessage()`

### Layer 3: Data Validation Errors

All persisted data is validated on load. Corrupted data is discarded and replaced with defaults:

| Store | Validation | Invalid data behavior |
|-------|-----------|----------------------|
| canvasManager | `validateCanvasData()` | Reset to empty canvas list |
| uiStore | `validateUIState()` | Reset to default settings |
| ragStore | `validateRagDocs()` | Clear document list |

### Layer 4: Provider Errors

Provider-specific errors (invalid API key, rate limit, model unavailable) are caught and displayed as user-friendly messages:

```typescript
try {
  await streamProvider(model, messages, config);
} catch (err) {
  if (err.status === 401) {
    showToast('error', 'Invalid API key. Check your settings.');
  } else if (err.status === 429) {
    showToast('error', 'Rate limited. Please wait a moment.');
  } else {
    showToast('error', `Provider error: ${err.message}`);
  }
}
```

### Layer 5: Code Execution Errors

Code sandbox errors are displayed inline in the output pane:
- Syntax errors show the line and character position
- Runtime errors show the stack trace
- Timeout errors show "Execution timed out after 30s"
- Sandbox violations show "Access denied: [API name] is not available"

---

## React Flow Integration Details

Mosaic configures React Flow with custom settings for optimal performance and behavior:

### Custom Node Types

```typescript
const nodeTypes = {
  messageNode: MessageNode,  // The only custom node type
};
```

All five node types (root, branch, response, suggestion, distillation) are rendered by `MessageNode`, which switches visual style based on `data.nodeType`.

### Custom Edge Types

```typescript
const edgeTypes = {
  liquidEdge: LiquidEdge,     // Default conversation edge
  tendrilEdge: TendrilEdge,   // Dotted suggestion edge
  distillEdge: DistillEdge,   // Gold dashed distillation edge
};
```

### React Flow Configuration

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onNodeClick={onNodeClick}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  minZoom={0.05}
  maxZoom={3}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
  fitView
  attributionPosition="bottom-left"
>
  <Background variant="dots" gap={20} size={1} />
  <MiniMap
    style={{ display: showMiniMap ? 'block' : 'none' }}
    nodeStrokeColor={getThemeColor('accent')}
  />
</ReactFlow>
```

### Node Filtering

Before rendering, nodes are filtered to exclude:
1. **Collapsed nodes**: When a parent is collapsed, all its descendants are hidden
2. **Descendant nodes**: Same as collapsed filtering
3. **Non-bookmarked nodes**: When bookmarks-only mode is active, non-bookmarked nodes are hidden

This filtering prevents React Flow from wasting resources rendering invisible elements.

### Connection Validation

Mosaic uses `isValidConnection` to prevent invalid edge creation:
- Edges must connect different nodes
- Circular connections are prevented
- Only liquidEdge type can be created by user actions (tendrilEdge and distillEdge are programmatically created)

---

## Performance Optimization Strategies

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| Code splitting | Vite config: `manualChunks` for react-flow and framer-motion | Smaller initial bundle |
| Node memoization | `React.memo(MessageNode)` with deep comparison | Prevents re-render of unchanged nodes |
| Selective subscriptions | Zustand selectors in all components | Only relevant state changes trigger re-renders |
| Debounced saves | 300ms debounce on canvas save | Reduces localStorage writes |
| Undo ring buffer | Max 50 snapshots | Prevents memory growth |
| Debounced streaming | Chunk coalescing during fast streams | Smoother UI updates |
| Virtual rendering | React Flow's built-in viewport-based rendering | Only renders visible nodes |
| Worker isolation | Code execution in separate thread | UI never blocks during execution |

---

## Next Steps

- [[State Management and Persistence]] — Deep dive into store architecture
- [[Liquid-Glass Physics Engine]] — The SVG filter-based glass rendering system
- [[Code Sandbox Architecture]] — Secure code execution in Web Workers
- [[Provider Protocol and Streaming]] — SSE streaming implementation details
