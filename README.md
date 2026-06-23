# Mosaic

> **Beta** — feedback welcome! Report issues or suggest features [here](https://github.com/anomalyco/opencode/issues).

A spatial canvas for AI conversations — branch, explore, and run code inline.

Mosaic turns linear AI chat into an interactive tree on an infinite canvas. Fork conversations from any message, explore multiple paths side-by-side, run code inline, and feed documents as RAG context.

## Why only Mistral?

Right now Mosaic only supports **Mistral AI** because their API has a generous free tier — you can use it without spending a dime. Support for OpenAI, Anthropic, and local models is planned.

## Features

- **Spatial canvas** — conversations branch like a tree, not a linear scroll. Drag, zoom, and arrange nodes freely.
- **Branch anytime** — click any message to fork the conversation. Explore alternatives in parallel without losing context.
- **Inline code execution** — run Python (via Pyodide/WASM) and JavaScript directly inside chat nodes.
- **RAG from documents** — upload PDFs or text files; the AI pulls relevant context from them automatically.
- **Mistral AI** — streaming responses, configurable temperature, system prompts, and model selection.
- **Glass UI** — 5 themes (Void, Dusk, Sand, Snow, Sunrise).
- **Minimap & search** — navigate large canvases with full-text search.
- **Bookmarks & collapsing** — bookmark nodes, collapse branches to reduce clutter.
- **Multi-canvas tabs** — work across multiple conversations.
- **Export / Import** — save and load canvases as JSON.
- **Analytics** — track token usage, costs, node counts, and branching stats.
- **Keyboard shortcuts** — zoom, fit view, search, undo, new chat, and more.

## Screenshots

| Canvas with conversation branches | Code execution inline |
|:---:|:---:|
| _Add screenshot of a branched conversation on the canvas_ | _Add screenshot showing Python/JS code running in a node_ |

| Settings & themes | Document RAG panel |
|:---:|:---:|
| _Add screenshot of the settings drawer with theme picker_ | _Add screenshot of the document upload panel_ |

## Download

Grab the latest installer for Windows:

- [Mosaic_0.1.0_x64_en-US.msi](./Mosaic_0.1.0_x64_en-US.msi)
- [Mosaic_0.1.0_x64_en-US.exe](./Mosaic_0.1.0_x64_en-US.exe)

> No installer yet for macOS/Linux. Build from source (see below) or open an issue if you'd like a binary for your platform.

## Getting Started (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust toolchain](https://rustup.rs/) (for Tauri builds)
- A [Mistral AI API key](https://console.mistral.ai/)

### Commands

```bash
npm install           # Install dependencies
npm run tauri:dev     # Run in development mode
npm run tauri:build   # Build for distribution
```

Build output goes to `src-tauri/target/release/bundle/`.

## Configuration

Open the settings drawer (gear icon in top bar) to configure:

- **API Key** — your Mistral API key (required)
- **System prompt** — custom instructions for the AI
- **Temperature** — 0.0 (precise) to 2.0 (creative)
- **Theme** — Void, Dusk, Sand, Snow, or Sunrise
- **Minimap** — toggle the canvas minimap

### Getting a Mistral API key

1. Go to [console.mistral.ai](https://console.mistral.ai/)
2. Sign up for a free account
3. Navigate to **API Keys** and create a new key
4. Paste it into Mosaic's settings drawer

The free tier includes generous credits — enough for heavy daily use.

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

## Roadmap

- [ ] OpenAI, Anthropic, and local model support
- [ ] Collaborative canvases
- [ ] Node grouping and labels
- [ ] Visual branching indicators
- [ ] Improved RAG chunking and embedding
- [ ] macOS / Linux builds

## Built With

- [Tauri](https://tauri.app/) v2 — native desktop shell (Rust backend)
- [React](https://react.dev/) 19 + TypeScript
- [React Flow](https://xyflow.com/) (@xyflow/react) — canvas and node graph
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Tailwind CSS](https://tailwindcss.com/) v3 — utility styles
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [Pyodide](https://pyodide.org/) — in-browser Python execution (WebAssembly)
- [Mistral AI](https://mistral.ai/) — LLM provider

## License

MIT
