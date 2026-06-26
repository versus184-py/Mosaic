# Canvas and Node System

Mosaic's core innovation is its **infinite spatial canvas** — a 2D plane where conversations grow as branching trees instead of a linear scroll. This page documents the canvas mechanics, node types, edge types, and all node operations.

---

## Architecture

The canvas is built on **React Flow** (@xyflow/react v12), a powerful library for node-based editors. Mosaic wraps React Flow in a custom `MosaicCanvas` component that provides:

- Infinite pan-and-zoom (zoom range: 0.05x to 3x)
- Custom node rendering with glass cards
- Custom edge rendering with animated paths
- Minimap navigation
- Background grid
- Node selection, drag, and connection

The canvas state is managed by **canvasStore** (Zustand), which holds nodes, edges, viewport, position history, and bookmarks.

---

## Node Types

Each message in Mosaic is a **node**. There are five node types, each with distinct visual and behavioral characteristics:

### Root Node

| Property | Value |
|----------|-------|
| Type | `root` |
| Purpose | Starting point of every conversation canvas |
| Visual | Standard glass card with welcome message |
| Special | Cannot be deleted; exactly one per canvas |
| Created | Automatically when a new canvas is created |

The root node contains the welcome message. Click it to begin your first conversation.

### Branch Node

| Property | Value |
|----------|-------|
| Type | `branch` |
| Purpose | User messages that start or continue a conversation thread |
| Visual | Standard glass card with user icon |
| Special | Can fork from any previous node |
| Created | When user sends a message |

A branch node represents a user's input. It always has a parent node (either the root, a previous branch, or a response). When you click a node and type a message, a new branch node is created as a child of that node.

### Response Node

| Property | Value |
|----------|-------|
| Type | `response` |
| Purpose | AI response to a user message |
| Visual | Standard glass card with AI icon, optional confidence badge |
| Special | Shows typing indicator while streaming; retry on error |
| Created | When AI responds to a user message |

Response nodes stream their content token-by-token. While streaming, you'll see an animated typing indicator (bouncing dots). If the stream fails, a retry button appears. When complete, the response is rendered as formatted Markdown (via `react-markdown` with GFM support). Code blocks within responses get interactive **Run** buttons.

### Suggestion Node

| Property | Value |
|----------|-------|
| Type | `suggestion` |
| Purpose | AI-generated follow-up questions for quick branching |
| Visual | Dimmed (0.45 opacity), italic text, connected with dotted edge |
| Special | Auto-dismisses after 30 seconds; materializes into branch on click |
| Created | Automatically after AI response (if tendrils enabled) |

Suggestion nodes are **auto-generated** potential follow-ups. They appear after each AI response if the "suggestion tendrils" feature is enabled. They connect via a dotted **TendrilEdge** and auto-dismiss after 30 seconds if not clicked. Clicking a suggestion node **materializes** it into a real branch — the suggestion text is copied to the input and you can refine it before sending.

### Distillation Node

| Property | Value |
|----------|-------|
| Type | `distillation` |
| Purpose | AI-generated summary of multiple conversation branches |
| Visual | Gold border with pulse animation, connected with gold dashed edges |
| Special | Created by the distillation feature |
| Created | When user triggers branch distillation |

Distillation nodes synthesize multiple leaf branches into a single coherent summary. They connect to all source leaves via distinctive **DistillEdge** connections.

---

## Edge Types

Edges connect nodes and indicate the relationship between them.

### LiquidEdge (Default)

| Property | Value |
|----------|-------|
| Type | `liquidEdge` |
| Visual | Solid Bezier curve with animated path drawing on mount |
| Opacity | Full (reduced to 0.3 for pruned branches) |
| Animation | `pathLength` animation on mount |

This is the standard conversation edge. It connects any parent-child pair of nodes.

### TendrilEdge

| Property | Value |
|----------|-------|
| Type | `tendrilEdge` |
| Visual | Dotted Bezier curve (stroke-dasharray: 3 8) |
| Opacity | 0.4 |
| Use | Connecting suggestion nodes to their parent responses |

TendrilEdges connect suggestion nodes to their parent responses. The dotted style visually distinguishes suggestions from actual conversation branches.

### DistillEdge

| Property | Value |
|----------|-------|
| Type | `distillEdge` |
| Visual | Gold (`hsla(45, 90%, 65%, 0.6)`) dashed Bezier curve |
| Use | Connecting distillation nodes to source leaves |

DistillEdges visually indicate that a node is a distillation/synthesis of the connected leaf nodes.

---

## Node Operations

### Creating Nodes

| Action | Result |
|--------|--------|
| Click a node → type message → Enter | New branch node + response node created as children |
| Click a suggestion node | Suggestion text copied to input, ready to send |
| `Shift+Enter` in input | Parallel debate — multiple response nodes created |

### Selecting and Moving

| Action | Result |
|--------|--------|
| Click a node | Select it (blue highlight border) |
| Drag a node's title area | Move the node and all descendants (position persists) |
| Click empty space | Deselect all nodes |

### Context Menu

Right-click any node to open the context menu:

| Item | Action |
|------|--------|
| **Bookmark** | Toggle bookmark on this node |
| **Collapse / Expand** | Collapse children behind a count badge |
| **Auto-arrange** | Run auto-layout from this node |
| **Delete** | Delete this node (with cascade confirmation if it has children) |
| **Undo** | Undo last position change |

### Deleting Nodes

Press `Delete` or `Backspace` on a selected node, or use the context menu.

**Cascade deletion**: If a node has children, a confirmation dialog appears:

```
This will delete this node and all descendant nodes.
Are you sure?
[Cancel] [Delete]
```

**Protected nodes**: Root nodes cannot be deleted.

### Collapsing Nodes

Collapsing a node hides all its descendant nodes behind a badge showing the count:

```
[Parent node] ─── [Child 1]
              ─── [Child 2]
              ─── [Child 3]

After collapse:

[Parent node (+3)]
```

To collapse:
1. Right-click a node → **Collapse**
2. Or use the collapse button on the node if visible

To expand:
1. Click the collapse badge on the parent
2. Or right-click → **Expand**

Collapsed state is persistent (saved in the canvas data).

### Bookmarking Nodes

Bookmarks help you tag important nodes for quick reference:

1. Right-click a node → **Bookmark** (or click the star icon)
2. Bookmarked nodes show a filled star icon (★)
3. Click the **Bookmarks** button (★) in the TopBar to filter: only bookmarked nodes visible
4. Click again to show all nodes

Bookmarks are saved per canvas.

---

## Auto-Layout

Mosaic includes an **auto-layout** algorithm that arranges nodes in a radial tree pattern:

1. The root node is placed at the center
2. Children are arranged in concentric rings around the root
3. BFS (Breadth-First Search) traversal determines placement order
4. Angular spacing accounts for the number of children at each level

**Trigger auto-layout**:
- Right-click any node → **Auto-arrange** (from that node downward)
- Settings drawer → **Auto-arrange** (entire canvas)

Auto-layout also runs automatically when new nodes are created (new nodes are placed at an optimal angle based on existing children count).

### Layout Algorithm Details

The layout uses these parameters:
- **Level spacing**: 250px between parent and child levels
- **Child arc**: Children are distributed within a 45-degree arc centered on the parent's outgoing direction
- **Sibling spacing**: Minimum 200px between sibling nodes
- **Radial distribution**: Nodes at the same depth form concentric rings

For example, a tree with root at center and 3 levels of branching would be arranged as:
- Level 0 (root): center (0, 0)
- Level 1: ring at radius 250px with angular spacing of 2π / (number of children)
- Level 2: ring at radius 500px, children of each L1 node arranged in their own arc
- Level 3: ring at radius 750px, same recursive pattern

This creates a natural, easy-to-read conversation tree where related branches cluster together.

### Node Position Calculation for New Nodes

When a new node is created as a child of an existing node, its position is calculated:

```typescript
function calculateChildPosition(parent: Node, existingChildren: Node[]): { x: number; y: number } {
  const LEVEL_SPACING = 250;
  const CHILD_SPACING = 200;
  
  // Distribute children in an arc
  const arcAngle = Math.PI / 3;  // 60 degrees
  const childCount = existingChildren.length;
  const newIndex = childCount;  // This child is the (count)th
  
  const angleRange = Math.min(arcAngle, (childCount) * 0.3);
  const startAngle = -angleRange / 2;
  const stepAngle = childCount > 0 ? angleRange / childCount : 0;
  const angle = startAngle + newIndex * stepAngle;
  
  return {
    x: parent.position.x + LEVEL_SPACING * Math.cos(angle),
    y: parent.position.y + LEVEL_SPACING * Math.sin(angle),
  };
}
```

The arc widens as more children are added, ensuring nodes don't overlap regardless of how many times a parent is branched from.

---

## Undo History

The canvas maintains a **position history** (ring buffer, max 50 entries) for safe experimentation:

| Action | Undoable? |
|--------|-----------|
| Node position drag | Yes |
| Node add/remove | Yes |
| Clear canvas | Yes |
| Node edit (text) | No |

Press `Ctrl+Z` to undo the last position change.

The undo system uses `deepClone` (with `structuredClone` and a manual fallback) to capture complete state snapshots before each change.

---

## Multi-Canvas Tabs

Mosaic supports **multiple canvases** in a tabbed interface:

| Action | How |
|--------|-----|
| **Create new canvas** | Click the `+` tab or Ctrl+N |
| **Switch canvas** | Click a tab |
| **Rename canvas** | Double-click a tab label |
| **Delete canvas** | Right-click a tab → Delete (auto-switches to another tab) |
| **Duplicate canvas** | Settings drawer → Duplicate |

Each canvas has its own:
- Nodes and edges
- Bookmarked nodes
- Position history
- Analytics data

Canvas data is saved to `localStorage` under keys `mosaic-canvas-data-{id}`. The canvas index is stored under `mosaic-canvases`.

---

## Canvas Viewport

| Action | Effect |
|--------|--------|
| Click+drag on empty space | Pan the canvas |
| Scroll wheel | Zoom in/out |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `F` | Fit view to show all nodes |
| Zoom slider | Fine-grained zoom (0.1x to 2x) |

The viewport is saved across sessions.

---

## Search

Press `Ctrl+F` or click the search icon (🔍) in the TopBar to open the **Search Overlay**:

- Searches **node labels** and **message content**
- Shows up to 20 results with node type badges
- Navigate results with ArrowUp/ArrowDown
- Press Enter to select a result and focus that node
- Press Escape to close
- Matched nodes get an accent glow highlight

---

## Node Data Structure

Internally, each node carries the following data (defined in `src/types/index.ts`):

```typescript
interface NodeData {
  label: string;          // The message text (Markdown)
  nodeType: 'root' | 'branch' | 'response' | 'suggestion' | 'distillation';
  collapsed?: boolean;    // Is this node collapsed?
  bookmarked?: boolean;   // Is this node bookmarked?
  confidence?: number;    // Confidence score (0-100) for responses
  isStreaming?: boolean;  // Is the AI currently streaming a response?
  error?: string;         // Error message if streaming failed
}
```

Edge data:

```typescript
interface EdgeData {
  edgeType: 'liquidEdge' | 'tendrilEdge' | 'distillEdge';
}
```

---

## Next Steps

- [[LLM Provider Integration]] — Configure AI providers
- [[Advanced AI Features]] — Confidence scoring, tendrils, distillation, pruning
- [[Keyboard Shortcuts and UI Reference]] — All shortcuts and UI elements
