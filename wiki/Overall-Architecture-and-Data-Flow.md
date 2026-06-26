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

## Next Steps

- [[State Management and Persistence]] — Deep dive into store architecture
- [[Liquid-Glass Physics Engine]] — The SVG filter-based glass rendering system
- [[Code Sandbox Architecture]] — Secure code execution in Web Workers
- [[Provider Protocol and Streaming]] — SSE streaming implementation details
