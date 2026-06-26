# Component API Reference

This page documents every React component in Mosaic, including props, behavior, and usage notes.

---

## Canvas Components

### MosaicCanvas

**File**: `src/components/canvas/MosaicCanvas.tsx`

The main canvas wrapper. Renders the React Flow component with all custom nodes and edges.

```typescript
// No props — reads from Zustand stores directly
function MosaicCanvas(): JSX.Element
```

**Internal structure**:
- Wraps `<ReactFlow>` with `<ReactFlowProvider>`
- Registers custom node types: `messageNode`
- Registers custom edge types: `liquidEdge`, `tendrilEdge`, `distillEdge`
- Handles node drag, edge connections, node clicks
- Renders `<Background>`, `<MiniMap>` (conditional), `<Controls>`
- Filters out collapsed/descendant nodes from view
- Handles zoom keyboard shortcuts (+, -, F)

---

### MessageNode

**File**: `src/components/canvas/MessageNode.tsx` (683 lines — the largest component)

The core node component. Renders as a glass card with message content, controls, and interactive elements.

```typescript
interface MessageNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
}

// Memoized with React.memo + deep comparison
const MessageNode = React.memo(function MessageNode(props: MessageNodeProps): JSX.Element
```

**NodeData shape**:

```typescript
interface NodeData {
  label: string;                     // Message content (Markdown)
  nodeType: 'root' | 'branch' | 'response' | 'suggestion' | 'distillation';
  collapsed?: boolean;
  bookmarked?: boolean;
  confidence?: number;               // 0-100 confidence score
  isStreaming?: boolean;
  error?: string;
}
```

**Sub-components rendered**:
- `GlassCard` — the glass container
- `NodeInput` — inline input (when active)
- `react-markdown` — renders message content with GFM
- `CodeBlock` — interactive code blocks within markdown
- Confidence badge (when nodeType='response' and confidence exists)
- Bookmark star icon
- Collapse badge with count
- Typing indicator (when isStreaming)
- Resize handle (bottom-right)
- Error display with retry button

**Context menu items**:
- Bookmark toggle
- Collapse/Expand
- Auto-arrange
- Delete (with cascade confirmation)
- Undo

**Special behaviors by node type**:
- `suggestion`: Dimmed (0.45 opacity), italic text, click-to-materialize
- `distillation`: Gold border with pulse animation
- `root`: Cannot be deleted
- `pruned`: Reduced opacity

---

### NodeInput

**File**: `src/components/canvas/NodeInput.tsx`

Inline input component for composing messages.

```typescript
interface NodeInputProps {
  parentNodeId: string;
  placeholder?: string;
}
```

**Features**:
- Textarea with auto-grow
- **Enter**: Send message
- **Shift+Enter**: Send with parallel debate
- **Mic button**: Speech recognition (uses `useSpeechRecognition`)
- **Send button**: Arrow icon
- **Debate button**: Multi-model icon (visible when debate models selected)
- Max length: 10,000 characters
- Placeholder: "Type a message..." (or "Send a follow-up..." for non-root nodes)

**Internal**:
- Uses `useStreamMessage().sendMessage()` for sending
- Clears text after successful send
- Shows character count near limit

---

### CodeBlock

**File**: `src/components/canvas/CodeBlock.tsx`

Rendered inside markdown content for code fences.

```typescript
interface CodeBlockProps {
  language: string;
  value: string;
}
```

**Language mapping**:
- `js`, `jsx`, `ts`, `tsx` → `javascript`
- `py`, `python` → `python`
- All others → read-only display (no run button)

**Features**:
- Language badge
- Run button (▶️) — executes code via `codeRunner.runCode()`
- Stop button (⏹) — cancels execution via AbortController
- Collapse/expand toggle for long code
- Output pane: shows stdout, results, errors
- Error display with red styling
- Dismiss button for output
- Confirmation dialog for AI-generated code (once per session)

**Internal**:
- Uses `codeRunner.runCode()` from `src/utils/codeRunner.ts`
- Reads `language` prop to select JavaScript or Python runtime
- Updates output state progressively as results arrive

---

### LiquidEdge

**File**: `src/components/canvas/LiquidEdge.tsx`

Default Bezier edge for conversation connections.

```typescript
interface LiquidEdgeProps {
  id: string;
  source: string;
  target: string;
  data?: EdgeData;
  selected?: boolean;
}
```

**Features**:
- Solid Bezier curve
- `pathLength` animation on mount (draws in)
- Pruned edges get reduced opacity (0.3)
- Pruned edges get modified dash pattern

---

### TendrilEdge

**File**: `src/components/canvas/TendrilEdge.tsx`

Dotted edge for suggestion connections.

```typescript
interface TendrilEdgeProps {
  id: string;
  source: string;
  target: string;
}
```

**Features**:
- Dotted Bezier: `stroke-dasharray="3 8"`
- Opacity: 0.4
- No animation

---

### DistillEdge

**File**: `src/components/canvas/DistillEdge.tsx`

Gold dashed edge for distillation connections.

```typescript
interface DistillEdgeProps {
  id: string;
  source: string;
  target: string;
}
```

**Features**:
- Gold color: `hsla(45, 90%, 65%, 0.6)`
- Dashed pattern
- No animation

---

## Glass UI Components

### GlassCard

**File**: `src/components/glass/GlassCard.tsx`

Universal glass container with two rendering modes.

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  lens?: boolean;              // Use Lens refraction mode
  clear?: boolean;             // Transparent variant
  tint?: string;               // Override glass tint color
  disableRipple?: boolean;     // Disable click ripple effect
  onClick?: () => void;
  style?: React.CSSProperties;
}
```

**Modes**:
- **Lens mode** (`lens={true}`): Uses `<Lens>` component for SVG filter refraction. More computationally expensive but visually richer.
- **Standard mode**: CSS-based glass layers:
  1. Backdrop blur filter layer
  2. Tint overlay layer (semi-transparent background)
  3. Shine/reflection layer (gradient)
  4. Ripple effect layer (on click)
  5. Content layer

---

### Lens

**File**: `src/components/glass/Lens.tsx`

Physics-based refraction lens using SVG displacement map.

```typescript
interface LensProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  surface?: SurfaceProfile;     // convex_squircle (default), convex_circle, concave, lip
  variant?: 'regular' | 'clear';
  interactive?: boolean;        // Enable touch/pointer displacement
  className?: string;
}
```

**Surface profiles**:
- `convex_squircle`: Smooth rounded convex (default)
- `convex_circle`: Spherical convex
- `concave`: Inward curve
- `lip`: Raised ring edge

**Implementation**: Uses SVG `<feDisplacementMap>` filter with a dynamically generated canvas-based displacement map. See [[Liquid-Glass Physics Engine]] for the full technical explanation.

---

### DragLens

**File**: `src/components/glass/DragLens.tsx`

Fixed-position draggable lens overlay on the canvas.

```typescript
// No props — self-contained component
function DragLens(): JSX.Element
```

**Features**:
- 120x120 pixel lens
- Pointer-based dragging with `pointer capture`
- Acts as a magnifying/refraction demo tool
- Initial position: bottom-right of canvas (offset from minimap)

---

### FluidSlider

**File**: `src/components/glass/FluidSlider.tsx`

Spring-animated slider with glass knob.

```typescript
interface FluidSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  label?: string;
}
```

**Spring parameters**:
- Idle: stiffness 180, damping 15
- Active (dragging): stiffness 300, damping 20

**Usage**: Zoom controls, temperature setting.

---

### TactileSwitch

**File**: `src/components/glass/TactileSwitch.tsx`

Spring-animated toggle switch with glass knob.

```typescript
interface TactileSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}
```

**Spring parameters**: Same as FluidSlider.

**Usage**: Minimap toggle, confidence toggle, tendrils toggle.

---

### SegmentControl

**File**: `src/components/glass/SegmentControl.tsx`

Segmented button group with active segment highlighted by Lens refraction.

```typescript
interface SegmentControlProps {
  segments: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}
```

**Features**:
- Active segment uses `<Lens>` component for visual distinction
- Smooth spring animation on segment switch

---

### GlassEffectContainer

**File**: `src/components/glass/GlassEffectContainer.tsx`

Provides shared backdrop context for grouped glass elements.

```typescript
interface GlassEffectContainerProps {
  children: React.ReactNode;
}
```

Uses React Context to share the backdrop element reference among child glass components.

---

## UI Components

### TopBar

**File**: `src/components/ui/TopBar.tsx`

Top navigation bar.

```typescript
// No props — reads from stores
function TopBar(): JSX.Element
```

**Elements**:
- Mosaic logo
- Model selector dropdown (groups models by provider with colored dots)
- Action buttons: Search, Bookmarks, Documents, Analytics, Distill, Prune, New Chat, Settings

### SettingsDrawer

**File**: `src/components/ui/SettingsDrawer.tsx`

Full settings modal.

```typescript
// No props — reads/writes uiStore
function SettingsDrawer(): JSX.Element
```

**Sections**: Theme grid, API keys, Ollama config, System prompt, Temperature, Canvas toggles, Actions (auto-arrange, export, import, clear), Shortcuts button.

### SearchOverlay

**File**: `src/components/ui/SearchOverlay.tsx`

Fixed-position search interface.

```typescript
// No props — reads/writes uiStore
function SearchOverlay(): JSX.Element
```

**Features**: Glass-styled search input, real-time filtering, 20 max results, keyboard navigation, result highlighting on canvas.

### ZoomControls

**File**: `src/components/ui/ZoomControls.tsx`

Fixed bottom-center zoom controls.

```typescript
// No props — reads canvas viewport
function ZoomControls(): JSX.Element
```

**Features**: FluidSlider for zoom (0.1x-2x), +/- buttons, percentage display.

### CanvasTabs

**File**: `src/components/ui/CanvasTabs.tsx`

Tab bar for multi-canvas management.

```typescript
// No props — reads/writes canvasManagerStore
function CanvasTabs(): JSX.Element
```

**Features**: Tab switching, rename (double-click), delete with auto-switch, new tab button. Active tab highlighted with Lens refraction.

### WelcomeScreen

**File**: `src/components/ui/WelcomeScreen.tsx`

Animated particle welcome overlay.

```typescript
// No props — reads uiStore.showWelcome
function WelcomeScreen(): JSX.Element
```

**Phases**: Idle (200 floating particles with mouse repulsion) → Burst (click scatters particles) → Gone (dismissed).

### DocumentPanel, AnalyticsPanel

**File**: `src/components/ui/DocumentPanel.tsx`, `src/components/ui/AnalyticsPanel.tsx`

Slide-in panels.

```typescript
// No props — read/write their respective stores
function DocumentPanel(): JSX.Element
function AnalyticsPanel(): JSX.Element
```

### ContextMenu

**File**: `src/components/ui/ContextMenu.tsx`

Right-click context menu.

```typescript
interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  destructive?: boolean;
  onClick: () => void;
}
```

Adjusts position to stay within viewport bounds.

### ToastContainer

**File**: `src/components/ui/ToastContainer.tsx`

Toast notification container.

```typescript
// No props — reads toastStore
function ToastContainer(): JSX.Element
```

**Toast types**: `info` (accent), `success` (green), `error` (red). Auto-dismiss with spring animation.

### PruneBanner

**File**: `src/components/ui/PruneBanner.tsx`

Prune status banner.

```typescript
// No props — reads pruneStore
function PruneBanner(): JSX.Element
```

Shows "Restore all" button when pruning is active.

### PythonTerminal

**File**: `src/components/ui/PythonTerminal.tsx`

Floating Python REPL.

```typescript
// No props — self-contained
function PythonTerminal(): JSX.Element
```

**Features**: 520x320 draggable widget, command history, `reset()`/`clear()` commands, persistent state, color-coded output (input/output/error/system).

### ErrorBoundary

**File**: `src/components/ui/ErrorBoundary.tsx`

Class-based error boundary.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

Shows error message with "Try again" button on failure.

---

## Next Steps

- [[Utilities and Types Reference]] — Utility functions and type definitions
- [[Store API Reference]] — All Zustand stores
- [[Keyboard Shortcuts and UI Reference]] — Complete UI documentation
