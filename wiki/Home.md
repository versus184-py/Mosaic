# Mosaic

> **Beta** — feedback welcome! Report issues or suggest features [here](https://github.com/versus184-py/Mosaic/issues).

**Mosaic turns linear AI chat into an interactive tree on an infinite canvas. Fork conversations from any message, explore multiple paths side-by-side, run code inline, and feed documents as RAG context.**

[![Release](https://img.shields.io/github/v/release/versus184-py/Mosaic?style=flat-square&label=Release)](https://github.com/versus184-py/Mosaic/releases)
[![Stars](https://img.shields.io/github/stars/versus184-py/Mosaic?style=flat-square&label=Stars)](https://github.com/versus184-py/Mosaic/stargazers)
[![Issues](https://img.shields.io/github/issues/versus184-py/Mosaic?style=flat-square&label=Issues)](https://github.com/versus184-py/Mosaic/issues)
![Beta](https://img.shields.io/badge/status-beta-yellow?style=flat-square)
![Tauri v2](https://img.shields.io/badge/Tauri-v2-purple?style=flat-square&logo=tauri)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)

---

## What is Mosaic?

Mosaic is a **desktop application** that reimagines the AI chat interface. Instead of a linear scroll of messages, Mosaic gives you an **infinite spatial canvas** where conversations grow as branching trees. Every AI response can be a starting point for a new direction — fork, explore, compare, and synthesize without losing context.

Built with **Tauri v2** (Rust backend) and **React 19** (TypeScript frontend), Mosaic is fast, secure, and cross-platform. The application runs natively on Windows, with macOS and Linux builds in development. The Rust backend provides a lightweight, secure shell while the entire UI is rendered via a webview, giving you the performance of a native app with the flexibility of web technologies.

### Why an Infinite Canvas?

Traditional AI chat interfaces are linear — a single thread of messages that grows downward. This works for simple Q&A but breaks down when you want to:

- **Explore alternatives**: Ask the AI to approach a problem from different angles, then compare responses side-by-side.
- **Branch into subtopics**: Follow an interesting tangent without losing the main conversation.
- **Iterate on ideas**: Refine a response through multiple rounds while keeping earlier versions for reference.
- **Synthesize insights**: Combine the best ideas from multiple conversation branches into a single coherent answer.

Mosaic's spatial canvas solves all of these. Every message is a node on an infinite 2D plane. Click any AI response to fork a new branch. Drag nodes to arrange them spatially. Collapse branches you don't need. Search across all nodes. The canvas grows with your thinking.

---

## Feature Overview

| Category | Feature | Details |
|----------|---------|---------|
| **Canvas** | Spatial canvas | Conversations branch like a tree, not a linear scroll. Drag, zoom, and arrange nodes freely on an infinite plane. |
| | Minimap | Navigate large canvases with an overview minimap showing all nodes and their positions. |
| | Multi-canvas tabs | Create, rename, duplicate, and switch between multiple conversation canvases simultaneously. |
| | Full-text search | Search across all node labels and message content with keyboard navigation. |
| | Bookmarks & collapsing | Bookmark important nodes for quick filtering; collapse entire branches to reduce visual clutter. |
| | Undo history | Position and structural undo with a 50-entry ring buffer for safe experimentation. |
| **AI** | Multi-provider | Mistral AI (primary), OpenAI, Anthropic, Gemini, and Ollama (local models). Switch between providers per conversation. |
| | Streaming responses | Real-time token-by-token streaming with configurable temperature (0.0-2.0) and system prompts. |
| | Conversation branching | Click any message to fork the conversation. Explore alternatives in parallel without losing context. |
| | Confidence scoring | AI auto-scores responses from 0-100 after each completion, displayed as a badge on the response node. |
| | Suggestion tendrils | Auto-generated follow-up questions that appear after AI responses, auto-dismissing after 30 seconds. |
| | Branch distillation | Summarize entire conversation branches into a single synthesis node with a single click. |
| | Branch pruning | AI-driven relevance scoring against a user-provided goal; dims low-scoring branches to reduce noise. |
| | Parallel debate | Run the same prompt through multiple provider models simultaneously; results fan out for side-by-side comparison. |
| **Code** | JavaScript execution | Sandboxed execution in a Web Worker with a strict allowlist of safe globals; network APIs are completely blocked. |
| | Python execution | In-browser Python via Pyodide (WebAssembly); supports numpy, pandas, scipy, matplotlib, and 9 other allowlisted packages. |
| | Python REPL | Floating persistent terminal with command history, reset/clear commands, and persistent global state across executions. |
| **RAG** | Document ingestion | Upload PDFs, text files, and code files in 25+ formats. Automatic chunking at 800 characters with 100-character overlap. |
| | Semantic search | TF-IDF cosine similarity search with optional embedding-based search via any connected provider. |
| | Context injection | Top 3 most relevant chunks are automatically appended to the system prompt for each query. |
| | Document limits | Supports up to 50 documents with a total size limit of 50 MB (10 MB per file). |
| **UI** | Glass UI system | Physics-based refractive glass components using SVG displacement maps, Snell's law simulation, and spring physics. |
| | 5 themes | Void (deep black/blue, cold minimal), Dusk (cosmic purple, rich tones), Sand (warm desert beige), Snow (clean cool gray), Sunrise (golden warm tones). |
| | Accessibility | Respects `prefers-reduced-motion` and `prefers-reduced-transparency` OS preferences. |
| | Animations | Framer Motion-powered entrance animations, spring-based sliders and switches, particle welcome screen. |
| **Security** | Sandboxed code execution | JavaScript executes with blocked network APIs; Python pip is limited to 14 allowlisted packages; fetches restricted to CDN hosts only. |
| | Strict CSP | Content Security Policy enforced at the Tauri level; restricts connect-src to only Mistral API and Pyodide CDNs. |
| | API key encryption | API keys are XOR-obfuscated in localStorage with a salt key to prevent casual exposure. |
| | Data validation | All imported canvas data, RAG documents, and stored UI state undergo schema validation before use. |
| **Analytics** | Token tracking | Per-model token usage estimation and cost calculation using provider pricing tables. |
| | Canvas statistics | Node counts, message counts, maximum depth, branching points, and per-model breakdowns. |
| | Data locality | All analytics data is stored locally in localStorage; no external telemetry or data collection. |

---

## Quick Links

- [[Installation Guide]] — Download or build from source
- [[Tutorial - Your First Conversation]] — Get started in 5 minutes
- [[LLM Provider Integration]] — Configure Mistral, OpenAI, Anthropic, Gemini, or Ollama
- [[Canvas and Node System]] — Understand the spatial canvas and node types
- [[Keyboard Shortcuts and UI Reference]] — All shortcuts and interface documentation
- [[Contributing Guide]] — How to help improve Mosaic

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop shell | [Tauri](https://tauri.app/) | v2 |
| Frontend framework | [React](https://react.dev/) | 19 |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5.8 |
| Canvas/graph | [React Flow](https://xyflow.com/) (@xyflow/react) | v12 |
| Animations | [Framer Motion](https://www.framer.com/motion/) | v12 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | v3 |
| State management | [Zustand](https://github.com/pmndrs/zustand) | v5 |
| In-browser Python | [Pyodide](https://pyodide.org/) | v0.26.2 |
| LLM providers | Mistral AI, OpenAI, Anthropic, Gemini, Ollama | — |
| Bundler | [Vite](https://vitejs.dev/) | v6 |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) | v10 |
| Rust runtime | [Rust](https://www.rust-lang.org/) | edition 2021 |

---

## Project Status

Mosaic is currently in **beta** (v0.2.0). The core features are stable and functional, but you may encounter edge cases. Feedback is actively welcomed via [GitHub Issues](https://github.com/versus184-py/Mosaic/issues).

### What works well
- Spatial canvas with branching conversations
- Multi-provider LLM integration with streaming
- Inline code execution (JavaScript and Python)
- RAG document querying
- Multi-canvas tabs
- Export/import of canvases

### What's coming
- Collaborative real-time canvases
- Node grouping and labels
- Visual branching indicators
- Improved RAG chunking and embedding
- macOS and Linux native builds
- Additional provider support

---

## Gallery

> Screenshots coming soon! Want to help? Take a screenshot and drop it in a [GitHub issue](https://github.com/versus184-py/Mosaic/issues).

---

## Quick Start

```bash
# Prerequisites: Node.js 18+, Rust toolchain, a Mistral AI API key

git clone https://github.com/versus184-py/Mosaic.git
cd Mosaic
npm install
npm run tauri:dev    # Development mode with hot reload
npm run tauri:build  # Production build
```

See the [[Installation Guide]] for detailed setup instructions, including how to obtain API keys and configure each provider.
