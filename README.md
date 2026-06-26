<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/versus184-py/Mosaic/main/src-tauri/icons/128x128@2x.png">
    <img src="https://raw.githubusercontent.com/versus184-py/Mosaic/main/src-tauri/icons/128x128@2x.png" alt="Mosaic" width="128">
  </picture>
</p>

<h1 align="center">Mosaic</h1>

<p align="center">
  <em>Branch, explore, and run code inline — an infinite canvas for AI conversations.</em>
</p>

<p align="center">
  <a href="https://github.com/versus184-py/Mosaic/releases">
    <img src="https://img.shields.io/github/v/release/versus184-py/Mosaic?style=flat-square&label=Release" alt="Release">
  </a>
  <a href="https://github.com/versus184-py/Mosaic/stargazers">
    <img src="https://img.shields.io/github/stars/versus184-py/Mosaic?style=flat-square&label=Stars" alt="Stars">
  </a>
  <a href="https://github.com/versus184-py/Mosaic/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/versus184-py/Mosaic/ci.yml?style=flat-square&label=CI" alt="CI">
  </a>
  <a href="https://github.com/versus184-py/Mosaic/issues">
    <img src="https://img.shields.io/github/issues/versus184-py/Mosaic?style=flat-square&label=Issues" alt="Issues">
  </a>
  <a href="https://github.com/versus184-py/Mosaic/discussions">
    <img src="https://img.shields.io/badge/discussions-enabled-blue?style=flat-square" alt="Discussions">
  </a>
  <a href="https://github.com/versus184-py/Mosaic/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License">
  </a>
  <a href="https://github.com/versus184-py/Mosaic/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
  </a>
  <img src="https://img.shields.io/badge/Tauri-v2-purple?style=flat-square&logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/tests-191-passing-brightgreen?style=flat-square" alt="Tests">
  <img src="https://img.shields.io/badge/platform-win%20|%20mac%20|%20linux-lightgrey?style=flat-square" alt="Platform">
</p>

---

Mosaic turns linear AI chat into an interactive tree on an infinite canvas. Fork conversations from any message, explore multiple paths side-by-side, run code inline (JavaScript via sandboxed Web Workers, Python via Pyodide WASM), and feed documents as semantic search context across 5 LLM providers.

---

## Screenshots

| Canvas with conversation branches | Code execution inline |
|:---:|:---:|
| <img width="640" height="360" alt="Canvas with branching conversation tree, minimap, and glass UI" src="https://raw.githubusercontent.com/versus184-py/Mosaic/main/screenshots/canvas-branches.png" /> | <img width="640" height="360" alt="Inline Python and JavaScript code execution inside chat nodes" src="https://raw.githubusercontent.com/versus184-py/Mosaic/main/screenshots/code-execution.png" /> |

| Settings & provider keys | Document RAG panel |
|:---:|:---:|
| <img width="640" height="360" alt="Settings drawer with per-provider API keys, Ollama connection panel, theme selector" src="https://raw.githubusercontent.com/versus184-py/Mosaic/main/screenshots/settings-providers.png" /> | <img width="640" height="360" alt="RAG semantic search panel with document upload and chunk viewer" src="https://raw.githubusercontent.com/versus184-py/Mosaic/main/screenshots/rag-panel.png" /> |

> Screenshots will appear once the `screenshots/` directory is created. Want to help? Take a screenshot and open an issue — we'll add it here.

---

## Use cases

| Scenario | How Mosaic helps |
|----------|------------------|
| **Research & analysis** | Branch conversations to explore competing hypotheses. Fork from any message to follow a tangent without losing context. |
| **Code review with AI** | Feed code as RAG context, ask the AI to analyze it, run the suggested code inline to verify before applying. |
| **Creative writing** | Generate multiple continuations in parallel branches. Use the canvas to arrange scenes, characters, and plot threads spatially. |
| **Learning & tutoring** | Fork a lesson to ask "why" without derailing the main thread. Collapse understood branches to focus on new material. |
| **Prompt engineering** | Compare responses from Mistral, OpenAI, Anthropic, Gemini, and local Ollama on the same prompt — side by side on the same canvas. |
| **Document Q&A** | Upload technical papers, manuals, or notes. The RAG engine retrieves semantically relevant chunks to ground AI responses. |
| **Parallel debate** | Route the same input to multiple models simultaneously and compare their reasoning on the same canvas. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri v2 Desktop Shell                    │
│  (Rust backend — window management, CSP enforcement, IPC)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    React 19 + TypeScript                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ canvasStore│  │ uiStore  │  │ ragStore │  │analyticsStore│ │
│  │ (Zustand) │  │(Zustand) │  │(Zustand) │  │ (Zustand)   │ │
│  │ nodes,    │  │ theme,   │  │ chunks,  │  │ token usage,│ │
│  │ edges,    │  │ settings,│  │ vectors, │  │ costs, stats│ │
│  │ undo,     │  │ provider,│  │ search   │  │             │ │
│  │ bookmarks │  │persist   │  │ results  │  │             │ │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
│        │              │              │               │        │
│  ┌─────▼──────────────▼──────────────▼───────────────▼──────┐ │
│  │                @xyflow/react Canvas                      │ │
│  │  (React Flow v12 — infinite pan/zoom, minimap,          │ │
│  │   custom nodes/edges, node selection)                    │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │  Provider Layer                                        │ │
│  │  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ │ │
│  │  │ Mistral  │ │ OpenAI │ │Anthropic│ │Gemini│ │Ollama│ │ │
│  │  │ REST API │ │ REST   │ │ SSE     │ │REST  │ │REST  │ │ │
│  │  │ streaming│ │stream  │ │stream   │ │stream│ │stream│ │ │
│  │  └─────────┘ └────────┘ └─────────┘ └──────┘ └──────┘ │ │
│  │  All streaming unified via AsyncGenerator<string>       │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │  Code Execution Layer                                  │ │
│  │  ┌────────────────────────────────┐ ┌────────────────┐ │ │
│  │  │ JavaScript Sandboxed Web Worker │ │ Pyodide (WASM) │ │ │
│  │  │ (no fetch, XHR, WebSocket,     │ │ (Python 3.12 — │ │ │
│  │  │  localStorage, or DOM access)  │ │  numpy, pandas, │ │ │
│  │  └────────────────────────────────┘ │  scipy, etc.)   │ │ │
│  │                                     └────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

The app uses **Zustand** for state management across 5 stores, **React Flow v12** for the infinite canvas, and an **AsyncGenerator-based streaming layer** that unifies 5 different provider APIs into a single interface. **RAG** is powered by semantic embeddings (using the first available embedder from Ollama → Mistral → OpenAI → Gemini) with TF-IDF cosine similarity as fallback. **Code execution** runs in sandboxed Web Workers (JS) or Pyodide WebAssembly (Python) — both with network and filesystem restrictions enforced by CSP.

---

## Comparison

| Feature | Mosaic | ChatGPT | Claude | NotebookLM |
|---------|--------|---------|--------|------------|
| Spatial canvas (tree) | ✅ Branch from any message | ❌ Linear scroll | ❌ Linear scroll | ❌ Notebook-style |
| Multi-provider | ✅ 5 providers | ❌ OpenAI only | ❌ Anthropic only | ❌ Gemini only |
| Local LLM (Ollama) | ✅ Auto-detected | ❌ | ❌ | ❌ |
| RAG / document grounding | ✅ Semantic + TF-IDF | ✅ (GPTs) | ❌ | ✅ (Google docs) |
| Code execution | ✅ JS + Python (sandboxed) | ❌ | ❌ (artifact viewer) | ❌ |
| Glass UI themes | ✅ 5 themes | ❌ 1 theme | ❌ 1 theme | ❌ 1 theme |
| Offline capable | ✅ (with local Ollama) | ❌ | ❌ | ❌ |
| Open source | ✅ MIT | ❌ | ❌ | ❌ |
| Cross-platform desktop | ✅ Win/Mac/Linux | ✅ Web/Mac app | ✅ Web/Mac app | ✅ Web only |
| Cost control | ✅ Any provider, any price | ❌ Fixed subscription | ❌ Fixed subscription | ❌ Free (limited) |

---

## Features

| Category | Details |
|----------|---------|
| **Multi-provider AI** | Mistral, OpenAI, Anthropic, Gemini, **and** local Ollama — switch freely in the model picker. |
| **Semantic search** | AI embeddings power RAG context retrieval. Falls back to TF-IDF when no embedder is available. |
| **Ollama support** | Auto-detected on launch. Pull models locally for free, offline-capable inference. |
| **Spatial canvas** | Conversations branch like a tree, not a linear scroll. Drag, zoom, and arrange nodes freely. |
| **Branch anytime** | Click any message to fork the conversation. Explore alternatives in parallel without losing context. |
| **Inline code execution** | Run Python (via Pyodide/WASM) and JavaScript (sandboxed Web Worker) directly inside chat nodes. |
| **RAG from documents** | Upload text files; the AI pulls relevant context from them automatically via semantic search. |
| **Glass UI** | 5 themes: Void (dark), Dusk (dim), Sand (light), Snow (cool light), Sunrise (colorful). |
| **Minimap & search** | Navigate large canvases with full-text search across all nodes. |
| **Bookmarks & collapsing** | Bookmark nodes, collapse branches to reduce clutter. |
| **Multi-canvas tabs** | Work across multiple conversation canvases simultaneously. |
| **Export / Import** | Save and load canvases as JSON files. |
| **Analytics** | Track token usage, costs, node counts, and branching statistics. |
| **Keyboard shortcuts** | Zoom, fit view, search, undo, new chat, and more. |
| **Cross-platform** | Windows (.msi), macOS (.dmg), Linux (.AppImage). |

---

## Quick Start

### Download

Grab the installer for your platform from the [Releases page](https://github.com/versus184-py/Mosaic/releases).

- **Windows** — `.msi` installer
- **macOS** — `.dmg` disk image
- **Linux** — `.AppImage` (portable)

### Documentation

Visit the **Documentation website** for comprehensive technical deep-dive, architecture details, and API references.
[Documentation](https://versus184-py.github.io/Mosaic/)

### Get Help

- **Wiki** - Browse interactive documentation, installation guides, and tutorials
- **GitHub** - Source code, releases, issues, and contributions

### Build from Source

**Prerequisites:** [Node.js](https://nodejs.org/) 18+, [Rust toolchain](https://rustup.rs/), and an API key for at least one provider.

```bash
npm install           # Install dependencies
npm run tauri:dev     # Run in development mode
npm run tauri:build   # Build for distribution
```

Build output goes to `src-tauri/target/release/bundle/`.

---

## Configuration

Open the settings drawer (gear icon in top bar) to configure:

| Setting | Description |
|---------|-------------|
| **API Keys** | Per-provider keys for Mistral, OpenAI, Anthropic, and Gemini (stored encrypted) |
| **Ollama URL** | Address of your local Ollama instance (default `http://localhost:11434`) |
| **System prompt** | Custom instructions for the AI |
| **Temperature** | 0.0 (precise) to 2.0 (creative) |
| **Theme** | Void, Dusk, Sand, Snow, or Sunrise |
| **Confidence scoring** | AI auto-scores responses (0–100) |
| **Follow-up suggestions** | Auto-generated suggestions after each response |
| **Minimap** | Toggle the canvas minimap on/off |

### Getting an API key

You need at least one provider key. Choose from:

- **[Mistral](https://console.mistral.ai/)** — Free tier includes generous credits
- **[OpenAI](https://platform.openai.com/api-keys)** — Pay-as-you-go
- **[Anthropic](https://console.anthropic.com/)** — Pay-as-you-go
- **[Gemini](https://aistudio.google.com/apikey)** — Free tier available
- **[Ollama](https://ollama.com/)** — Fully free and local (no API key needed)

Mistral is the default provider. Paste your key into the settings drawer — it is XOR-encrypted before being stored in localStorage.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New chat |
| `Ctrl+F` | Search messages |
| `Ctrl+Z` | Undo position |
| `+` / `-` | Zoom in / out |
| `F` | Fit canvas to view |
| `?` | Show all shortcuts |
| `Delete` / `Backspace` | Delete selected node |
| `Escape` | Deselect node |

---

## Performance

- **Canvas**: Tested with 200+ nodes. Performance scales with React Flow's virtual rendering — only visible nodes are painted.
- **Memory**: ~150–300 MB idle (V8 heap), varies with canvas size and RAG document count.
- **Startup**: Cold start ~2–4s (Tauri shell + React hydration + Ollama probe). Subsequent launches faster with OS caching.
- **Code execution**: Python warm-up ~1–2s (Pyodide WASM download + interpreter init). JS execution is near-instant.
- **RAG search**: Semantic embedding ~200–800ms per query (depends on provider). TF-IDF fallback <50ms.
- **Streaming**: First token latency varies by provider: Mistral ~300ms, OpenAI ~500ms, Anthropic ~800ms, Gemini ~400ms, Ollama ~100ms (local).

---

## Roadmap

- [x] Multi-provider support (Mistral, OpenAI, Anthropic, Gemini, Ollama)
- [x] Semantic search with embedding-based RAG
- [x] macOS / Linux builds
- [x] Automated test suite (191 tests)
- [x] CI/CD pipeline (Windows, macOS, Linux)
- [x] MIT License
- [ ] Collaborative canvases
- [ ] Node grouping and labels
- [ ] Visual branching indicators
- [ ] Improved RAG chunking strategies
- [ ] Plugin / extension system

---

## Built With

- [Tauri](https://tauri.app/) v2 — native desktop shell (Rust backend)
- [React](https://react.dev/) 19 + TypeScript
- [React Flow](https://xyflow.com/) (@xyflow/react) — canvas and node graph
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Tailwind CSS](https://tailwindcss.com/) v3 — utility styles
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [Pyodide](https://pyodide.org/) — in-browser Python execution (WebAssembly)
- [Vitest](https://vitest.dev/) — unit and component testing
- **LLM Providers:**
  - [Mistral AI](https://mistral.ai/)
  - [OpenAI](https://openai.com/)
  - [Anthropic (Claude)](https://anthropic.com/)
  - [Google Gemini](https://deepmind.google/technologies/gemini/)
  - [Ollama](https://ollama.com/) (local)

---

## Contributing

Contributions are welcome! Here's how to help:

1. **Report bugs** — open a [bug report](https://github.com/versus184-py/Mosaic/issues/new?labels=bug&template=bug.yml)
2. **Suggest features** — open a [feature request](https://github.com/versus184-py/Mosaic/issues/new?labels=enhancement&template=feature.yml)
3. **Submit PRs** — fork the repo, make your changes, and open a [pull request](https://github.com/versus184-py/Mosaic/compare)
4. **Share screenshots** — help fill the gallery above

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

---

## Release Notes

### v0.3.0 — Multi-Provider AI, Semantic Search, Cross-Platform Builds & Test Suite

**New Providers**
- **OpenAI** — GPT-4o and GPT-4o Mini via streaming completions and embeddings
- **Anthropic** — Claude Sonnet 4 and Claude Haiku 3.5 via SSE streaming
- **Gemini** — Gemini 2.5 Pro and Gemini 2.5 Flash with API key in query parameter
- **Ollama** — Local model support with auto-detection, dynamic model listing from `/api/tags`, and embedding via `nomic-embed-text`

**Semantic Search (RAG v2)**
- Document chunks are embedded at upload time using the first available embedder
- Embeddings stored alongside chunks in the vector store
- Queries are embedded at search time for proper semantic similarity matching
- Embedding priority: Ollama → Mistral → OpenAI → Gemini (Anthropic skipped — no embeddings API)
- Falls back to TF-IDF cosine similarity when no embedder is available

**Model Selector**
- Provider-grouped dropdown with colored indicators (blue → Mistral, green → OpenAI, orange → Anthropic, yellow → Gemini, purple → Ollama)
- Ollama models dynamically appended when connected

**Settings Drawer**
- Per-provider API key inputs with encrypted localStorage storage
- Ollama connection panel with URL input, connect button, and live status indicator
- System instruction textarea (4000 char limit), temperature slider

**Testing**
- 191 automated tests across 11 test files
- API layer: config (XOR encrypt/decrypt, cache, provider resolution), provider routing, Ollama URL management
- Stores: ragStore (vector search, limit boundaries), uiStore (all 5 providers, theme class, persistence), canvasStore (cascade, undo stack, bookmarks, conversation path)
- Utilities: validation (all edge cases), layout (radial positioning, deep clone, tree layout)
- Components: SettingsDrawer and TopBar with user-event interaction
- Hooks: chunkText algorithm (boundary detection, overlap, unicode)
- Canvas mock for jsdom compatibility

**Cross-Platform**
- CI/CD via GitHub Actions: `ubuntu-latest` for type-check + test + build
- Release workflow: matrix build for `windows-latest`, `macos-latest`, `ubuntu-latest`
- Artifacts: `.msi` (Windows), `.dmg` (macOS), `.AppImage` (Linux)

**Other**
- MIT License added
- Removed CSP meta tag from `index.html` (CSP lives only in Tauri config)
- Fixed `tauri.conf.json` schema URL to official `tauri-apps/tauri` repo
- Replaced `any` types with proper TypeScript types across store and API layers
- Ollama auto-detected on app mount via `useOllamaDetect` hook

---

### v0.2.0 — Glass UI, Confidence Scoring, Tendrils, Distillation & More

**New Features**
- Glass UI system — physics-based refractive glass components: Lens, FluidSlider, TactileSwitch, DragLens, SegmentControl, GlassEffectContainer
- Confidence scoring — AI auto-scores responses (0–100) after each completion
- Suggestion tendrils — auto-generated follow-up suggestions that appear after AI responses, auto-dismiss after 30s
- Branch distillation — summarize entire conversation branches into a single synthesis node
- Branch pruning — AI-driven relevance scoring to dim low-value branches
- Parallel debate — run responses from multiple models simultaneously on the same input
- Validation utilities for imported canvas data, RAG docs, and stored state
- Undo history now captured for add/remove/clear operations
- New edge types: DistillEdge (gold dash), TendrilEdge (dotted)

**UI/UX**
- Floating draggable lens overlay on canvas
- Spring-animated FluidSlider and TactileSwitch components
- Prune banner with restore-all button
- Confidence badges, pruned node dimming, search highlights on nodes
- Settings drawer: confidence scoring and tendrils toggles, improved API key UX
- Zoom controls now use FluidSlider

**Security**
- Sandboxed JS execution with complete network blocking
- Pyodide fetch restricted to allowlisted CDN hosts (cdn.jsdelivr.net, pyodide-cdn2.iodide.io, files.pythonhosted.org)
- pip installs limited to an allowlist (numpy, pandas, scipy, matplotlib, sympy, requests, beautifulsoup4, lxml, Pillow, markdown, jinja2, pyyaml, toml, colorama, tqdm)
- CSP enforced at Tauri level (was previously null)
- Integrity checks on Pyodide module load
- Imported canvas data validated before use

**Fixes**
- Added `deepClone` utility with `structuredClone` fallback for undo snapshots
- `analyticsStore`: type fixes in `computeNodeStats`, data validation on localStorage load
- `canvasManagerStore`: validate canvas data on load, reset invalid data
- `ragStore`: enforce document count (50) and total size (50 MB) limits
- `codeWorker`: strict sandboxed globals with blocked APIs (fetch, XHR, WebSocket, Worker, localStorage, etc.)

---

### v0.1.0 — Initial Beta Release

- Infinite spatial canvas using React Flow (@xyflow/react)
- Conversation branching — fork from any message, explore paths in parallel
- Mistral AI integration — streaming responses, configurable temperature, model selection
- 5 glass UI themes: Void, Dusk, Sand, Snow, Sunrise
- Inline code execution: JavaScript via sandboxed Web Worker, Python via Pyodide (WASM)
- RAG from uploaded documents — automatic chunking and TF-IDF cosine similarity search
- Multi-canvas tabs — create, rename, duplicate, switch canvases
- Export/import canvases as JSON
- Analytics tracking — token usage, cost, node counts, branching stats
- Minimap, full-text search, bookmarks, node collapsing
- Keyboard shortcuts — Ctrl+N, Ctrl+F, Ctrl+Z, zoom, fit, delete
- Onboarding hints for new users
- Undo support for node positions
