<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/versus184-py/Mosaic/main/src-tauri/icons/128x128@2x.png">
    <img src="https://raw.githubusercontent.com/versus184-py/Mosaic/main/src-tauri/icons/128x128@2x.png" alt="Mosaic" width="128">
  </picture>
</p>

<h1 align="center">Mosaic</h1>

> **Beta** — feedback welcome! Report issues or suggest features [here](https://github.com/versus184-py/Mosaic/issues).

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
  <a href="https://github.com/versus184-py/Mosaic/issues">
    <img src="https://img.shields.io/github/issues/versus184-py/Mosaic?style=flat-square&label=Issues" alt="Issues">
  </a>
  <img src="https://img.shields.io/badge/status-beta-yellow?style=flat-square" alt="Beta">
  <img src="https://img.shields.io/badge/Tauri-v2-purple?style=flat-square&logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React">
</p>

---

> **Beta** — feedback welcome! Report issues or suggest features [here](https://github.com/versus184-py/Mosaic/issues).

Mosaic turns linear AI chat into an interactive tree on an infinite canvas. Fork conversations from any message, explore multiple paths side-by-side, run code inline, and feed documents as RAG context.

---

<h2 align="center">Gallery</h2>

<p align="center">
  <i>Screenshots coming soon! Want to help? Take a screenshot and drop it in a <a href="https://github.com/versus184-py/Mosaic/issues">GitHub issue</a>.</i>
</p>

<!--
TODO: Add real screenshots here. Suggested layout:

| Canvas with conversation branches | Code execution inline |
|:---:|:---:|
|<img width="1919" height="839" alt="image" src="https://github.com/user-attachments/assets/3278719d-aae8-4987-8930-aa079f4ca614" />
|<img width="1248" height="819" alt="image" src="https://github.com/user-attachments/assets/4023b775-8892-4b7a-9f58-384c3f994136" />
|

| Settings & themes | Document RAG panel |
|:---:|:---:|
|<img width="804" height="984" alt="image" src="https://github.com/user-attachments/assets/43973c8d-24a1-4348-9e0b-10678652ec41" />
|<img width="357" height="1031" alt="image" src="https://github.com/user-attachments/assets/0c2b74ef-d13f-413f-9234-e9d17a3ed8eb" />
|
-->

---

## Features

| Category | Details |
|----------|---------|
| **Spatial canvas** | Conversations branch like a tree, not a linear scroll. Drag, zoom, and arrange nodes freely. |
| **Branch anytime** | Click any message to fork the conversation. Explore alternatives in parallel without losing context. |
| **Inline code execution** | Run Python (via Pyodide/WASM) and JavaScript directly inside chat nodes. |
| **RAG from documents** | Upload PDFs or text files; the AI pulls relevant context from them automatically. |
| **Mistral AI** | Streaming responses, configurable temperature, system prompts, and model selection. |
| **Glass UI** | 5 themes: Void, Dusk, Sand, Snow, Sunrise. |
| **Minimap & search** | Navigate large canvases with full-text search across all nodes. |
| **Bookmarks & collapsing** | Bookmark nodes, collapse branches to reduce clutter. |
| **Multi-canvas tabs** | Work across multiple conversation canvases simultaneously. |
| **Export / Import** | Save and load canvases as JSON files. |
| **Analytics** | Track token usage, costs, node counts, and branching statistics. |
| **Keyboard shortcuts** | Zoom, fit view, search, undo, new chat, and more. |

---

## Quick Start

### Download

Grab the latest Windows installer from the [Releases page](https://github.com/versus184-py/Mosaic/releases).

> No installer for macOS/Linux yet. Build from source (see below) or open an issue if you'd like a binary for your platform.

### Build from Source

**Prerequisites:** [Node.js](https://nodejs.org/) 18+, [Rust toolchain](https://rustup.rs/), a [Mistral AI API key](https://console.mistral.ai/).

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
| **API Key** | Your Mistral API key (required) |
| **System prompt** | Custom instructions for the AI |
| **Temperature** | 0.0 (precise) to 2.0 (creative) |
| **Theme** | Void, Dusk, Sand, Snow, or Sunrise |
| **Minimap** | Toggle the canvas minimap on/off |

### Getting a Mistral API key

1. Go to [console.mistral.ai](https://console.mistral.ai/)
2. Sign up for a free account
3. Navigate to **API Keys** and create a new key
4. Paste it into Mosaic's settings drawer

The free tier includes generous credits — enough for heavy daily use.

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

## Roadmap

- [ ] OpenAI, Anthropic, and local model support
- [ ] Collaborative canvases
- [ ] Node grouping and labels
- [ ] Visual branching indicators
- [ ] Improved RAG chunking and embedding
- [ ] macOS / Linux builds

---

## Built With

- [Tauri](https://tauri.app/) v2 — native desktop shell (Rust backend)
- [React](https://react.dev/) 19 + TypeScript
- [React Flow](https://xyflow.com/) (@xyflow/react) — canvas and node graph
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Tailwind CSS](https://tailwindcss.com/) v3 — utility styles
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [Pyodide](https://pyodide.org/) — in-browser Python execution (WebAssembly)
- [Mistral AI](https://mistral.ai/) — LLM provider

---

## Contributing

Contributions are welcome! Here's how to help:

1. **Report bugs** — open an [issue](https://github.com/versus184-py/Mosaic/issues)
2. **Suggest features** — open an [issue](https://github.com/versus184-py/Mosaic/issues)
3. **Submit PRs** — fork the repo, make your changes, and open a pull request
4. **Share screenshots** — help fill the gallery above

---

## Release Notes

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
