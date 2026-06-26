# Future Ideas

This page is a **brainstorming collection** of ideas that could extend Mosaic. These are not commitments — they're possibilities to inspire contributors and spark discussion. Ideas range from small quality-of-life tweaks to major architectural changes.

Feel free to open a [GitHub issue](https://github.com/versus184-py/Mosaic/issues) if any of these excite you, or add your own ideas!

---

## Canvas & UX

### Split-view canvas comparison
Side-by-side mode to compare two canvases or two branches visually, with synchronized scrolling and diff highlighting.

### Node templates
Save a node's system prompt, temperature, and model as a reusable template. "New node from template" option in the context menu.

### Mini-map interactions
Click on the mini-map to jump to that location. Drag the mini-map viewport to pan the canvas.

### Canvas backgrounds
Custom background images or colors per canvas. Useful for visual organization (e.g., green background for "done", yellow for "in progress").

### Node colors and labels
User-assignable colors and custom labels on nodes for visual categorization. Filter by color or label.

### Edge labels
Small text labels on edges to describe the relationship (e.g., "refines", "critiques", "expands on").

### Collapse all / Expand all
One-click buttons to collapse or expand every branch on the canvas simultaneously.

### Auto-save with version history
Save snapshots of the canvas at regular intervals, with the ability to browse and restore previous versions.

### Canvas health dashboard
A panel showing canvas size, node count, token usage, and warnings (e.g., "This canvas has 300 nodes — consider splitting").

### Drag-and-drop nodes between canvases
Drag a node from one canvas tab to another to copy or move it between conversations.

### Node grouping with containers
Visual containers (boxes with titles) that group related nodes together. Collapse/expand the entire group.

### Undo/redo for all actions
Expand undo to cover text edits, bookmark toggles, collapse state changes — not just position changes.

### "Focus mode"
Temporarily dim everything except the active branch, reducing visual noise.

---

## AI & Providers

### Local LLM runner
Bundle a lightweight local LLM (like Llama 3.2 1B via WASM or Tauri sidecar) so Mosaic works fully offline without any API key.

### Multi-step agentic loops
The AI autonomously runs code, reads the output, and continues refining without user intervention — useful for data analysis tasks.

### AI canvas summarization
An AI-generated summary of the entire canvas or a specific branch, displayed as a sticky note overlay.

### Auto-branch naming
Let the AI suggest names for each branch based on its content, displayed as a small label on the branch's first node.

### Chat history export with metadata
Export conversations as Markdown, HTML, or PDF with timestamps, model info, and confidence scores.

### Tool/function calling
Let the AI call external tools (web search, calculator, code execution) as part of its response. Structured tool definitions.

### AI persona library
Pre-built system prompts for common personas (tutor, code reviewer, creative writer, debate opponent) that users can browse and apply.

### Custom model parameters
Expose advanced parameters: top-p, top-k, frequency penalty, presence penalty, stop sequences, response format (JSON mode).

### Prompt variable injection
Use `{{variable}}` syntax in system prompts that get replaced with canvas metadata (node count, total tokens, date, etc.).

### Multi-modal support
Image input/output, audio transcription, file generation — leveraging provider vision and audio APIs.

### Response temperature fading
Gradually decrease temperature across a branch so early responses are creative and later ones converge to a refined answer.

---

## Code Execution

### Output visualization
Auto-detect chart generation (matplotlib, plotly) and render it inline as an image, not just text output.

### Multi-file code projects
Let users create small code projects with multiple files. Run, test, and share them within a node.

### Interactive widgets
Render simple UI widgets (sliders, buttons, text inputs) from code output that can modify variables and re-execute.

### Persistent file system
A virtual in-memory file system within the code sandbox so files written in one execution persist to the next.

### WASM plugin execution
Allow running any WebAssembly module, not just Pyodide — Rust, C, Go compiled to WASM.

### Code block sharing
A "share this code" button that creates a permalink to a gist or pastebin with the code and output.

### Package explorer
Browse available packages within the sandbox, search for specific functions, and see documentation without leaving Mosaic.

### Live code collaboration
Multiple users editing the same code block simultaneously (Operational Transform / CRDT).

### SQL execution
Built-in SQLite in WASM for querying CSV/JSON data with SQL directly in chat.

### Shell command execution
A sandboxed shell (like WebContainers) for running shell commands, npm install, git operations — all in WASM.

---

## RAG & Knowledge

### Web page ingestion
Paste a URL and have Mosaic fetch, parse, and chunk the web page content for RAG — no manual save-and-upload needed.

### Image OCR for PDF
Extract text from scanned PDFs and images using OCR (tesseract in WASM or via provider vision API).

### Multi-turn RAG conversation
Remember which chunks were used in previous turns and avoid repeating them. Track conversation context with document references.

### RAG source citation per sentence
When the AI uses RAG context, highlight which source document and chunk each sentence came from.

### Automated document tagging
AI-generated tags for uploaded documents (e.g., "technical", "finance", "code") for better organization.

### RAG knowledge graph
Build a graph of concepts extracted from documents, showing relationships between ideas across documents.

### Document Q&A history
Show previous questions and answers for each document, so users can see what insights have already been extracted.

### Hybrid search ranking
Combine keyword (BM25/TF-IDF) and semantic (embedding) scores with configurable weights.

### Chunk overlap visualization
Show how chunks overlap in the original document, with the ability to adjust chunk size and overlap interactively.

### Incremental re-indexing
When a document is updated, only re-index the changed chunks instead of the entire document.

---

## Collaboration

### Real-time collaborative canvases
Multiple users editing the same canvas simultaneously with cursor presence, using CRDTs or WebSocket sync.

### Canvas sharing via link
Generate a read-only or editable link to a canvas. Hosted via a lightweight sync server or peer-to-peer.

### Comments and annotations
Add comments to specific nodes. Threaded discussions on individual messages.

### Branch merge requests
Propose merging one branch into another, with a diff view and approval workflow.

### Public canvas gallery
A place to share and discover interesting canvases — templates, research trees, learning paths.

### Change history with author attribution
See who changed what and when on collaborative canvases.

### Canvas embedding
Embed a read-only canvas view in a web page or blog post.

### @mentions and notifications
Tag other users in comments or nodes. Get notified when someone replies or mentions you.

---

## Platform & Integration

### Web version (PWA)
A Progressive Web App version that runs in the browser without Tauri, with localStorage persistence and optional cloud sync.

### Mobile app
Touch-optimized mobile interface for viewing canvases, reading conversations, and basic branching.

### VSCode extension
Open Mosaic canvases from within VS Code. Use selection context to automatically populate questions.

### Obsidian plugin
Import/export canvases to/from Obsidian. Link notes to conversation nodes.

### Slack/Discord integration
Share nodes or entire branches to Slack or Discord channels.

### GitHub integration
Link commits, PRs, and issues to conversation nodes. AI-assisted code review with context from related canvases.

### CLI tool
A command-line interface for exporting, searching, and managing canvases from the terminal.

### System tray integration
Minimize to system tray with quick-access menu for recent canvases and new chat.

### Global search (across canvases)
Search across all canvases simultaneously, not just the current one.

### Auto-tagging and categorization
AI tags canvases based on content for automatic organization. Filter canvas list by tag.

### Desktop notifications
Get notified when a streaming response completes, or when a long code execution finishes.

---

## Data & Analytics

### Export analytics dashboard
See total token usage, cost, and model distribution across all canvases over time.

### Canvas insights
AI-generated insights about your canvas: "You branch most frequently from Mistral Large responses", "Your average branch depth is 4.2 nodes".

### Token budget alerts
Set a daily/weekly token budget and get warned when approaching it.

### Visual conversation flow
Export a visual graph (PNG/SVG) of the canvas, suitable for presentations or documentation.

### Data export in multiple formats
Export canvas data as JSON, Markdown, HTML, CSV (flat node list), or OPML (outline format).

### Canvas statistics history
Track how canvas size, depth, and branch count change over time.

### Response time tracking
Log how long each provider takes to respond and surface performance trends.

---

## Quality of Life

### Sound effects
Subtle audio cues for stream completion, errors, and new suggestions. Respects `prefers-reduced-motion`.

### Reading mode
A clean, print-friendly view of a branch or entire canvas, stripping away UI chrome.

### Auto-scroll during streaming
Automatically scroll to keep the currently streaming node in view.

### Drag-to-reorder nodes
Drag a node to change its position in the conversation order (not just spatial position).

### Custom CSS
Let power users inject custom CSS to personalize the appearance beyond the built-in themes.

### Built-in tutorial overlay
An interactive walkthrough that highlights UI elements and explains features step by step.

### Keyboard shortcut customization
Let users remap keyboard shortcuts to their preference.

### Workspaces
Group canvases into workspaces (e.g., "Work", "Personal", "Research") with independent settings and themes.

### Snooze feature
Mark a canvas as "snoozed" — it disappears from the main view but can be unsnoozed later.

### Pin important canvases
Pin frequently used canvases to the top of the tab bar.

### Search filters
Filter search by node type, date range, bookmarked status, or provider.

---

## Experimental / Wild Ideas

### Canvas as code
Save canvases as a declarative format (YAML/TOML) that can be version-controlled, diffed, and reconstructed.

### LLM voting system
When multiple models respond, let users vote on which answer is best. Aggregate votes across canvases to rank models by task type.

### Conversation time travel
A slider that shows the canvas state at different points in time — scrub forward and backward through the conversation.

### Markov chain node prediction
Predict which nodes the user is likely to click next based on their history. Pre-fetch the AI response for instant display.

### Reinforcement learning from canvas interactions
Learn which follow-up suggestions users actually click and improve suggestion quality over time.

### Branch probability heatmap
Visual overlay showing which branches were most explored, most collapsed, or most bookmarked.

### Turing test mode
Hide which AI model generated a response and let the user guess — a gamified way to compare providers.

### Canvas generated from meeting transcripts
Upload a meeting transcript and have Mosaic automatically build a conversation tree from the discussion flow.

### Dreaming mode
Let the AI wander autonomously — generate chains of self-directed thought across the canvas, branching on its own curiosities.

### Thought spiral visualization
Render the canvas as a 3D spiral or radial tree with WebGL, with smooth camera fly-throughs.

---

## How to Contribute an Idea

1. **Check the existing issues** on [GitHub Issues](https://github.com/versus184-py/Mosaic/issues) to avoid duplicates
2. **Open a new issue** with the `idea` label
3. **Describe the idea**: What problem does it solve? How might it work? What would it look like?
4. **Discuss and refine**: Engage with the community to shape the idea

The best ideas come with use cases — describing a real problem you've encountered makes it much more compelling.

---

## Next Steps

- [[Changelog and Roadmap]] — What's actually planned for upcoming releases
- [[Contributing Guide]] — How to help implement these ideas
- [[Home]] — Back to the wiki home
