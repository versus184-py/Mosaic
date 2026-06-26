# Changelog and Roadmap

---

## Changelog

### v0.3.0 — Multi-Provider AI, Semantic Search, Cross-Platform Builds & Test Suite

**Release date**: June 26, 2026

#### New Features

- **Multi-provider AI** — Five LLM providers with full streaming support:
  - **OpenAI** — GPT-4o and GPT-4o Mini via streaming completions and embeddings
  - **Anthropic** — Claude Sonnet 4 and Claude Haiku 3.5 via SSE streaming
  - **Gemini** — Gemini 2.5 Pro and Gemini 2.5 Flash with API key in query parameter
  - **Ollama** — Local model support with auto-detection, dynamic model listing from `/api/tags`, and embedding via `nomic-embed-text`
- **Semantic search (RAG v2)** — Document chunks are embedded at upload time using the first available embedder. Embeddings stored alongside chunks. Queries are embedded at search time for semantic similarity matching. Falls back to TF-IDF when no embedder is available.
- **Embedding provider priority**: Ollama → Mistral → OpenAI → Gemini (Anthropic skipped — no embeddings API)
- **Model selector** — Provider-grouped dropdown with colored indicators (blue → Mistral, green → OpenAI, orange → Anthropic, yellow → Gemini, purple → Ollama)
- **Settings drawer** — Per-provider API key inputs with encrypted localStorage storage, Ollama connection panel with URL input and live status indicator, system instruction textarea (4000 char limit)
- **Ollama auto-detection** — `useOllamaDetect` hook polls `/api/tags` on startup
- **Streaming architecture** — All providers use `AsyncGenerator<string>` pattern via `yield*` delegation

#### Testing

- 191 automated tests across 11 test files
- API layer: config (XOR encrypt/decrypt, cache, provider resolution), provider routing, Ollama URL management
- Stores: ragStore (vector search, limit boundaries), uiStore (all 5 providers, theme class, persistence), canvasStore (cascade, undo stack, bookmarks, conversation path)
- Utilities: validation (all edge cases), layout (radial positioning, deep clone, tree layout)
- Components: SettingsDrawer and TopBar with user-event interaction
- Hooks: chunkText algorithm (boundary detection, overlap, unicode)
- Canvas mock for jsdom compatibility

#### Platform & CI/CD

- CI/CD via GitHub Actions: `ubuntu-latest` for type-check + test + build
- Release workflow: matrix build for `windows-latest`, `macos-latest`, `ubuntu-latest` with `fail-fast: false`
- Artifacts: `.msi` + NSIS `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux)
- Assets uploaded via `softprops/action-gh-release@v2`

#### Other

- MIT License added
- Removed CSP meta tag from `index.html` (CSP lives only in Tauri config)
- Fixed `tauri.conf.json` schema URL to official `tauri-apps/tauri` repo
- Replaced `any` types with proper TypeScript types across store and API layers
- `ProviderId` union type (`"mistral" | "openai" | "anthropic" | "gemini" | "ollama"`)
- `streamProvider` now uses `AsyncGenerator` pattern with `yield*` delegation
- `embedTexts` returns `null` (never throws) when all providers fail

---

### v0.2.0 — Glass UI, Confidence Scoring, Tendrils, Distillation & More

**Release date**: June 26, 2026

#### New Features

- **Glass UI system** — Physics-based refractive glass components:
  - Lens — SVG displacement map refraction
  - GlassCard — Universal glass container with lens/standard modes
  - FluidSlider — Spring-animated slider
  - TactileSwitch — Spring-animated toggle
  - SegmentControl — Segmented button group with lens highlight
  - DragLens — Floating draggable lens overlay
  - GlassEffectContainer — Shared backdrop context
- **Confidence scoring** — AI auto-scores responses (0-100) after each completion
- **Suggestion tendrils** — Auto-generated follow-up suggestions that appear after AI responses, auto-dismiss after 30s
- **Branch distillation** — Summarize entire conversation branches into a single synthesis node with gold DistillEdge connections
- **Branch pruning** — AI-driven relevance scoring against user-provided goal; dims low-scoring branches
- **Parallel debate** — Run responses from multiple models simultaneously on the same input with fan-out layout
- **Validation utilities** — `validateNodeData`, `validateImportedCanvas`, `validateCanvasData`, `validateRagDocs`, `validateUIState`
- **Undo history** — Now captures add/remove/clear operations (previously only position changes)
- **New edge types**:
  - DistillEdge — Gold dashed edge for distillation connections
  - TendrilEdge — Dotted edge for suggestion connections

#### UI/UX

- Floating draggable lens overlay on canvas (DragLens)
- Spring-animated FluidSlider and TactileSwitch components
- Prune banner with restore-all button
- Confidence badges on response nodes
- Pruned node dimming (reduced opacity)
- Search highlights on matched nodes
- Settings drawer:
  - Confidence scoring toggle
  - Tendrils toggle
  - Improved API key UX (masked inputs)
- Zoom controls now use FluidSlider

#### Security

- Sandboxed JS execution with complete network blocking
- Pyodide fetch restricted to allowlisted CDN hosts:
  - `cdn.jsdelivr.net`
  - `pyodide-cdn2.iodide.io`
  - `files.pythonhosted.org`
- Pip installs limited to allowlist (15 packages):
  numpy, pandas, scipy, matplotlib, sympy, requests, beautifulsoup4, lxml, Pillow, markdown, jinja2, pyyaml, toml, colorama, tqdm
- CSP enforced at Tauri level (was previously null)
- Integrity checks on Pyodide module load
- Imported canvas data validated before use

#### Fixes

- Added `deepClone` utility with `structuredClone` fallback for undo snapshots
- `analyticsStore`: type fixes in `computeNodeStats`, data validation on localStorage load
- `canvasManagerStore`: validate canvas data on load, reset invalid data
- `ragStore`: enforce document count (50) and total size (50 MB) limits
- `codeWorker`: strict sandboxed globals with blocked APIs (fetch, XHR, WebSocket, Worker, localStorage, etc.)

---

### v0.1.0 — Initial Beta Release

**Release date**: TBD

#### Features

- Infinite spatial canvas using React Flow (@xyflow/react v12)
- Conversation branching — fork from any message, explore paths in parallel
- Mistral AI integration — streaming responses, configurable temperature, model selection
- 5 glass UI themes: Void, Dusk, Sand, Snow, Sunrise
- Inline code execution:
  - JavaScript via sandboxed Web Worker
  - Python via Pyodide (WASM)
- RAG from uploaded documents — automatic chunking and TF-IDF cosine similarity search
- Multi-canvas tabs — create, rename, duplicate, switch canvases
- Export/import canvases as JSON
- Analytics tracking — token usage, cost, node counts, branching stats
- Minimap, full-text search, bookmarks, node collapsing
- Keyboard shortcuts — Ctrl+N, Ctrl+F, Ctrl+Z, zoom, fit, delete
- Onboarding hints for new users
- Undo support for node positions

---

## Roadmap

### Short Term (Next Release)

- [ ] **macOS / Linux builds** — Provide prebuilt binaries for all platforms
- [ ] **OpenAI, Anthropic, Gemini integration** — Support beyond Mistral (in progress)
- [ ] **Improved RAG chunking** — Smarter chunk boundaries (paragraph-aware, code-aware)
- [ ] **Better RAG embeddings** — Improved embedding pipeline with caching

### Medium Term

- [ ] **Visual branching indicators** — Better visual distinction between branches
- [ ] **Node grouping and labels** — Group related nodes with custom labels
- [ ] **Performance optimizations** — Handle larger canvases (500+ nodes) smoothly
- [ ] **Custom provider endpoints** — Allow users to configure arbitrary API endpoints
- [ ] **Search improvements** — Regex search, search filters, saved searches

### Medium Term

- [ ] **Visual branching indicators** — Better visual distinction between branches
- [ ] **Node grouping and labels** — Group related nodes with custom labels and colors
- [ ] **Performance optimizations** — Handle larger canvases (500+ nodes) smoothly with virtual scrolling and lazy loading
- [ ] **Custom provider endpoints** — Allow users to configure arbitrary API endpoints with custom auth
- [ ] **Search improvements** — Regex search, search filters, saved searches, search within specific branches
- [ ] **Canvas templates** — Pre-built prompt templates and canvas layouts for common workflows
- [ ] **Code execution improvements** — More allowlisted packages, larger timeout option, multi-file support
- [ ] **RAG enhancements** — Smarter chunk boundaries (paragraph-aware, code-aware), hybrid search (TF-IDF + embeddings)

### Long Term

- [ ] **Collaborative canvases** — Real-time multi-user collaboration with cursor presence, comments, and conflict resolution. Users working on the same canvas would see each other's cursors, nodes would sync in real-time via WebSocket or WebRTC, and changes would be merged using CRDT (Conflict-free Replicated Data Types) for offline support.
- [ ] **Plugin system** — Third-party extensions for providers, tools, UI components, and canvas integrations. Plugin API would allow registering custom node types, provider integrations, toolbar buttons, and context menu items. Plugins could be distributed as npm packages or loaded from URLs.
- [ ] **Local model support** — Full integration with llama.cpp, GPT4All, Ollama, and other local inference engines. Beyond basic chat completion, this would include embedding generation, function calling, and structured output support.
- [ ] **Mobile companion** — View and interact with canvases on mobile devices. Sync via local network or cloud storage. Optimized touch interactions for canvas navigation and node manipulation.
- [ ] **Version history** — Per-canvas version history with diffs, branching, and rollback. Git-like commit model with author attribution and merge capabilities. Visual diff view showing what changed between versions.
- [ ] **Tauri v2 commands** — Native file I/O, system notifications, deep links, system tray integration, and custom title bar. Move beyond localStorage for data persistence — use SQLite or file-based storage for larger datasets and better performance.
- [ ] **AI-powered features** — Automatic conversation summarization, smart suggestions based on canvas context, automatic branch naming, semantic canvas search, AI-assisted node organization and layout.

---

## Feature Status

| Feature | v0.1.0 | v0.2.0 | v0.3.0 | Next | Future |
|---------|--------|--------|--------|------|--------|
| Spatial canvas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Conversation branching | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mistral AI integration | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-provider (OpenAI, Anthropic, Gemini, Ollama) | — | — | ✅ | ✅ | ✅ |
| Semantic search (embeddings) | — | — | ✅ | ✅ | ✅ |
| Inline code execution (JS + Python) | ✅ | ✅ | ✅ | ✅ | ✅ |
| RAG from documents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-canvas tabs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export/Import | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Keyboard shortcuts | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 themes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Undo history | ✅ | ✅ | ✅ | ✅ | ✅ |
| Glass UI system | — | ✅ | ✅ | ✅ | ✅ |
| Confidence scoring | — | ✅ | ✅ | ✅ | ✅ |
| Suggestion tendrils | — | ✅ | ✅ | ✅ | ✅ |
| Branch distillation | — | ✅ | ✅ | ✅ | ✅ |
| Branch pruning | — | ✅ | ✅ | ✅ | ✅ |
| Parallel debate | — | ✅ | ✅ | ✅ | ✅ |
| Security hardening | — | ✅ | ✅ | ✅ | ✅ |
| Test suite (191 tests) | — | — | ✅ | ✅ | ✅ |
| CI/CD pipeline | — | — | ✅ | ✅ | ✅ |
| Cross-platform builds | — | — | ✅ | ✅ | ✅ |
| Collaborative canvases | — | — | — | — | 🔄 |
| Node grouping | — | — | — | 🔄 | — |
| Plugin system | — | — | — | — | 🔄 |

✅ = Complete | 🔄 = In progress/planned

---

### Completed in v0.3.0

The following features from the previous roadmap were delivered in v0.3.0:

**New Providers** ✅
- [x] Full OpenAI integration (GPT-4o, GPT-4o-mini)
- [x] Anthropic integration (Claude Sonnet 4, Haiku 3.5)
- [x] Gemini integration (2.5 Pro, 2.5 Flash)
- [x] Ollama integration (auto-detect, local models)
- [x] Provider router with fallback chain

**RAG Improvements** ✅
- [x] Embedding-based semantic search (hybrid TF-IDF + embeddings)
- [x] Embedding provider priority chain (Ollama → Mistral → OpenAI → Gemini)
- [x] Embeddings computed at upload time and stored alongside chunks

**Platform & Testing** ✅
- [x] Cross-platform builds: Windows (.msi + .exe), macOS (.dmg), Linux (.AppImage)
- [x] CI/CD pipeline (GitHub Actions: type-check, test, build)
- [x] 191 automated tests across 11 test files
- [x] MIT License added

### Planned v0.4.0

**UI/UX**
- [ ] Visual branching indicators (colored edge highlights per branch)
- [ ] Node grouping with custom labels and colors
- [ ] Improved canvas performance for 500+ nodes
- [ ] Custom provider endpoint configuration

**Developer Experience**
- [ ] Tauri v2 commands for native file I/O
- [ ] File-based persistence (optional, beyond localStorage)
- [ ] Canvas templates and starter packs
- [ ] Export to Markdown/PDF

### Future Major Features

**v1.0.0 Milestone**
- Stable API and data format
- All 5 providers fully integrated and tested
- Cross-platform support (Windows, macOS, Linux)
- Comprehensive test coverage
- Security audit completed

**Beyond v1.0.0**
- Real-time collaborative canvases (WebSocket sync)
- Plugin system for third-party extensions
- Mobile companion app (view and share canvases)
- Version history with diff and rollback
- AI-powered canvas organization (auto-grouping, smart naming)

---

## How to Influence the Roadmap

The roadmap is driven by user feedback. If you'd like to see a feature prioritized:

1. **Upvote existing issues**: Add a 👍 reaction to GitHub issues you care about
2. **Create new issues**: Suggest features with clear use cases
3. **Contribute**: Submit a pull request implementing a feature
4. **Share feedback**: Tell us what's working and what's not

See the [[Contributing Guide]] for details.

---

## Next Steps

- [[Contributing Guide]] — Help build the features on this roadmap
- [[Project Governance and Community]] — Learn about project leadership
- [[Installation Guide]] — Get started with the latest release
