# Keyboard Shortcuts and UI Reference

This page documents every keyboard shortcut, UI element, and panel in Mosaic.

---

## Keyboard Shortcuts

### Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+N` | New chat (new canvas) | Global |
| `Ctrl+F` | Open search overlay | Global |
| `Ctrl+Z` | Undo last position change | Canvas |
| `F` | Fit canvas view to show all nodes | Canvas |
| `+` / `=` | Zoom in | Canvas |
| `-` | Zoom out | Canvas |
| `Escape` | Deselect node / close overlay | Global |

### Editing

| Shortcut | Action | Context |
|----------|--------|---------|
| `Delete` | Delete selected node | Canvas |
| `Backspace` | Delete selected node | Canvas |
| `Enter` | Send message (when input is focused) | Node input |
| `Shift+Enter` | Send with parallel debate | Node input |

### General

| Shortcut | Action |
|----------|--------|
| `?` | Show shortcuts modal |
| `Ctrl+,` | Open settings (via gear button) |

### Search Overlay Navigation

| Key | Action |
|-----|--------|
| `ArrowUp` | Move to previous result |
| `ArrowDown` | Move to next result |
| `Enter` | Select highlighted result |
| `Escape` | Close search overlay |

### Python Terminal

| Key | Action |
|-----|--------|
| `ArrowUp` | Previous command in history |
| `ArrowDown` | Next command in history |

---

## UI Elements Reference

### TopBar

The TopBar runs along the top edge of the window and provides quick access to all major features:

```
┌──────────────────────────────────────────────────────────────┐
│  Mosaic  │  Model: Mistral Large ▼  │  🔍  ★  📄  📊  🌿  │
│          │                          │  🧹  ➕  ⚙️          │
└──────────────────────────────────────────────────────────────┘
```

| Icon | Element | Action |
|------|---------|--------|
| — | Model dropdown | Select AI provider and model |
| 🔍 | Search | Open search overlay (Ctrl+F) |
| ★ | Bookmarks | Toggle bookmarks-only view |
| 📄 | Documents | Open DocumentPanel (RAG) |
| 📊 | Analytics | Open AnalyticsPanel |
| 🌿 | Distill | Trigger branch distillation |
| 🧹 | Prune | Trigger branch pruning |
| ➕ | New chat | Create new canvas (Ctrl+N) |
| ⚙️ | Settings | Open Settings drawer |

### Canvas Area

The main canvas area occupies most of the window:

| Element | Description |
|---------|-------------|
| **Background grid** | Subtle dot grid pattern for spatial reference |
| **Nodes** | Conversation messages (see [[Canvas and Node System]]) |
| **Edges** | Connections between nodes |
| **Minimap** | (Optional) Overview of the entire canvas in bottom-right |
| **DragLens** | (Optional) Floating refraction lens overlay |

### Zoom Controls

Fixed at the bottom-center of the window:

```
            [+]
[Zoom: 100% ■━━━━━━━○]
            [-]
```

| Control | Action |
|---------|--------|
| `+` button | Zoom in |
| `-` button | Zoom out |
| Slider | Fine-grained zoom (0.1x to 2x) |
| Percentage display | Current zoom level |

The zoom slider is implemented as a `FluidSlider` — a spring-animated glass component.

### Minimap

Located in the bottom-right corner (when enabled). Shows:
- All nodes as small rectangles
- Current viewport as a highlighted rectangle
- Node positions relative to each other

Toggle via Settings → Minimap.

---

## Panels

### Settings Drawer

Opened by clicking the gear icon (⚙️) in the TopBar. A full-width modal divided into sections:

| Section | Content |
|---------|---------|
| **Theme** | Grid of 5 themes: Void, Dusk, Sand, Snow, Sunrise |
| **API Keys** | Masked inputs for Mistral, OpenAI, Anthropic, Gemini keys |
| **Ollama** | URL input, Detect button, connection status |
| **System Prompt** | Textarea for custom AI instructions |
| **Temperature** | Slider (0.0 to 2.0) |
| **Canvas** | Toggles: Minimap, Confidence scoring, Tendrils |
| **Actions** | Auto-arrange, Export JSON, Import JSON, Clear canvas |
| **Shortcuts** | Open shortcuts modal |

### Search Overlay

Opened by clicking the search icon (🔍) or pressing `Ctrl+F`:

- Fixed-position overlay with glass styling
- Text input with real-time filtering
- Up to 20 results with node type badges
- Keyboard navigation (ArrowUp/Down, Enter)
- Escape to close
- Matched nodes highlighted with accent glow

### DocumentPanel

Opened by clicking the Documents icon (📄):

- Slide-in panel from the right
- Lists all uploaded documents with chunk count and size
- RAG enable/disable toggle
- Upload button (supports 25+ file formats)
- Clear All button
- Per-document delete

### AnalyticsPanel

Opened by clicking the Analytics icon (📊):

- Slide-in panel from the right
- **Canvas Statistics**: total nodes, root/branch/response counts, messages, max depth, branch points
- **Token Usage**: per-model token counts
- **Cost**: per-model and total cost (USD)
- **Model Breakdown**: per-model completion counts
- Reset analytics button

### Shortcuts Modal

Opened by pressing `?` or from Settings drawer:

- Lists all keyboard shortcuts grouped by category:
  - Navigation
  - Editing
  - Canvas
  - General
- Glass-styled modal with dismiss button

### Context Menu

Opened by right-clicking a node:

| Item | Action |
|------|--------|
| Bookmark | Toggle bookmark |
| Collapse / Expand | Toggle branch collapse |
| Auto-arrange | Run auto-layout from this node |
| Delete | Delete node (with cascade confirmation) |
| Undo | Undo last position change |

### Prune Banner

Appears at the bottom when pruning is active:

```
[🧹 Prune active — some branches dimmed by relevance scoring]
[Restore All]
```

Click **Restore All** to un-prune all branches.

### Toast Notifications

Appear at the top-center of the window. Auto-dismiss with spring animation:

| Type | Color | Purpose |
|------|-------|---------|
| Info | Accent (blue) | General notifications |
| Success | Green | Operation completed successfully |
| Error | Red | Operation failed |

### Python Terminal

A floating REPL terminal (520x320 pixels):

- Persistent Python environment
- Command history with ArrowUp/Down
- Supports `reset()`, `clear()`, and `!reset`, `!clear`
- Input/output/error/system message types with different colors
- Draggable position

### Welcome Screen

Appears on first launch:

- Animated canvas particle system (200 particles)
- Mouse repulsion effect
- "Click anywhere to begin" prompt
- Three phases: idle (floating), burst (particles scatter), gone (dismissed)
- Fades into main app on interaction

### Onboarding Hint

Appears on first use:

- Small bubble: "Click a node to reply"
- Dismissed permanently via localStorage flag
- Only shown once per installation

---

## Theme CSS Custom Properties

Each theme defines a set of CSS custom properties used throughout the app. These are defined in `src/styles/globals.css` under `.theme-{void|dusk|sand|snow|sunrise}` classes.

### Core Variables

| Variable | Purpose | Example Values |
|----------|---------|---------------|
| `--bg` | Base background | `#0a0a0f` (Void), `#1a0a2e` (Dusk), `#f5e6d3` (Sand) |
| `--bg-1` | Elevated surface 1 | `#14141f` (Void), `#2a1040` (Dusk) |
| `--bg-2` | Elevated surface 2 | `#1e1e2e` (Void), `#3a1a50` (Dusk) |
| `--bg-3` | Elevated surface 3 | `#28283e` (Void) |

### Glass Variables

| Variable | Purpose |
|----------|---------|
| `--glass` | Glass background color (semi-transparent) |
| `--glass-hover` | Glass background on hover |
| `--glass-active` | Glass background when active |
| `--glass-border` | Glass border color |
| `--glass-edge` | Glass edge highlight color |
| `--glass-content-bg` | Inner content background |
| `--glass-tint-a/b/c` | Tint overlay colors (RGB only) |

### Text Variables

| Variable | Purpose |
|----------|---------|
| `--text` | Primary text color |
| `--text-secondary` | Secondary/subtle text |
| `--text-muted` | Muted text (disabled, hints) |

### Effect Variables

| Variable | Purpose |
|----------|---------|
| `--shadow` | Drop shadow color (semi-transparent) |
| `--accent` | Accent color (interactive elements) |
| `--accent-alpha` | Accent with transparency (glows) |
| `--grid-color` | Canvas background grid color |
| `--dialog-bg` | Modal/dialog backdrop |

### Example: Void Theme

```css
.theme-void {
  --bg: #0a0a0f;
  --bg-1: #14141f;
  --bg-2: #1e1e2e;
  --bg-3: #28283e;
  --glass: rgba(20, 20, 35, 0.7);
  --glass-hover: rgba(30, 30, 50, 0.8);
  --glass-active: rgba(40, 40, 65, 0.9);
  --glass-border: rgba(100, 100, 140, 0.2);
  --glass-edge: rgba(150, 150, 200, 0.1);
  --text: #e8e8f0;
  --text-secondary: #a0a0b8;
  --text-muted: #606078;
  --shadow: rgba(0, 0, 0, 0.5);
  --accent: #3b82f6;
  --accent-alpha: rgba(59, 130, 246, 0.3);
  --grid-color: rgba(100, 100, 140, 0.08);
  --dialog-bg: rgba(0, 0, 0, 0.6);
}
```

### Adding a Custom Theme

1. Add a new class in `src/styles/globals.css` (e.g., `.theme-ocean { ... }`)
2. Define all required CSS custom properties
3. Add the theme name to the theme selector in Settings
4. The `uiStore.setTheme()` function will handle the class toggle automatically

---

## Next Steps

- [[Canvas and Node System]] — Node types, operations, and edge types
- [[Tutorial - Your First Conversation]] — Step-by-step walkthrough
- [[Shortcuts]] are also documented inline throughout this wiki
