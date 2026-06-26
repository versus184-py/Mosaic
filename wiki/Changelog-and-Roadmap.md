# Changelog and Roadmap

---

## Changelog

### v0.2.0 — Glass UI, Confidence Scoring, Tendrils, Distillation & More

**Release date**: TBD

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

### Long Term

- [ ] **Collaborative canvases** — Real-time multi-user collaboration
- [ ] **Plugin system** — Third-party extensions for providers, tools, UI
- [ ] **Local model support** — Full integration with llama.cpp, GPT4All, etc.
- [ ] **Mobile companion** — View and interact with canvases on mobile
- [ ] **Version history** — Per-canvas version history with diffs
- [ ] **Tauri v2 commands** — Native file I/O, system notifications, deep links

---

## Feature Status

| Feature | v0.1.0 | v0.2.0 | Next | Future |
|---------|--------|--------|------|--------|
| Spatial canvas | ✅ | ✅ | ✅ | ✅ |
| Conversation branching | ✅ | ✅ | ✅ | ✅ |
| Mistral AI integration | ✅ | ✅ | ✅ | ✅ |
| Multi-provider (OpenAI, Anthropic, Gemini, Ollama) | — | — | 🔄 | ✅ |
| Inline code execution (JS + Python) | ✅ | ✅ | ✅ | ✅ |
| RAG from documents | ✅ | ✅ | ✅ | ✅ |
| Multi-canvas tabs | ✅ | ✅ | ✅ | ✅ |
| Export/Import | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Keyboard shortcuts | ✅ | ✅ | ✅ | ✅ |
| 5 themes | ✅ | ✅ | ✅ | ✅ |
| Undo history | ✅ | ✅ | ✅ | ✅ |
| Glass UI system | — | ✅ | ✅ | ✅ |
| Confidence scoring | — | ✅ | ✅ | ✅ |
| Suggestion tendrils | — | ✅ | ✅ | ✅ |
| Branch distillation | — | ✅ | ✅ | ✅ |
| Branch pruning | — | ✅ | ✅ | ✅ |
| Parallel debate | — | ✅ | ✅ | ✅ |
| Security hardening | — | ✅ | ✅ | ✅ |
| Collaborative canvases | — | — | — | 🔄 |
| Node grouping | — | — | 🔄 | — |
| macOS/Linux builds | — | — | 🔄 | ✅ |
| Plugin system | — | — | — | 🔄 |

✅ = Complete | 🔄 = In progress/planned

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
