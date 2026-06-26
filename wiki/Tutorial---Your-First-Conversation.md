# Tutorial: Your First Conversation

This tutorial walks you through your first Mosaic session — from launching the app to having your first branched conversation.

**Estimated time**: 10 minutes

---

## Step 1: Launch Mosaic

Open Mosaic from your Start Menu (Windows), Applications folder (macOS), or run `npm run tauri:dev` if developing.

You'll see the **Welcome Screen** — a particle animation with floating dots against a dark background. Click anywhere to dismiss it and enter the main canvas.

---

## Step 2: Meet the Interface

The main window has several key areas:

```
┌─────────────────────────────────────────────────────┐
│  [Mosaic]  [Model: Mistral Large ▼] [🔍][★][📄]  │  ← TopBar
│  [📊][🌿][🧹][➕][⚙️]                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│           ┌──────────────────────┐                   │
│           │ Welcome to Mosaic!   │                   │  ← Canvas area
│           │                      │                   │     with nodes
│           │ Click a node to      │                   │
│           │ start a conversation │                   │
│           └──────────────────────┘                   │
│                                                     │
│                                                     │
│         [+][-] [Zoom: 100% ■━━━━━━━○]               │  ← Zoom controls
└─────────────────────────────────────────────────────┘
```

### Interface Elements

| Element | Location | Purpose |
|---------|----------|---------|
| **TopBar** | Top edge | Model selector, search, bookmarks, documents, analytics, settings |
| **Canvas** | Center | Infinite scrollable/zoomable space for conversation nodes |
| **Zoom controls** | Bottom center | Zoom slider and fit-to-view button |
| **Minimap** | Bottom-right corner (if enabled) | Overview of entire canvas |

---

## Step 3: Configure Your API Key

Before sending messages, you need an API key:

1. Click the **gear icon** (⚙️) in the top-right corner
2. The Settings drawer opens
3. Paste your Mistral AI API key into the **API Key** field
4. The key is stored securely (XOR-encrypted) in your browser's local storage
5. Close the Settings drawer

> Don't have an API key yet? Follow the [[Installation Guide]] for instructions on obtaining one.

---

## Step 4: Start a Conversation

1. Click on the **root node** (the welcome message in the center of the canvas)
2. A text input appears at the bottom of the node
3. Type a message, for example:

```
What are the best practices for writing clean Python code?
```

4. Press `Enter` (or click the send button) to send your message

You'll see:
- Your message appears as a new **branch node** (user message)
- The AI begins streaming its response character by character in a **response node**
- The response node has a **typing indicator** (animated dots) while streaming
- When complete, the full response is rendered as formatted Markdown

---

## Step 5: Follow Up

After the AI responds, you can continue the conversation:

1. Click on the AI's response node
2. Type a follow-up question, for example:

```
Can you show me an example of a Python decorator?
```

3. Press `Enter`

The new message appears connected to the previous response, forming a chain:

```
[root] → [You: best practices] → [AI: response] → [You: decorator example] → [AI: response]
```

---

## Step 6: Branch the Conversation

Now for the feature that makes Mosaic unique — **branching**:

1. Find an earlier AI response (not the most recent one)
2. Click on it
3. Instead of asking a follow-up, ask something different, for example:

```
What are the alternatives to decorators in Python?
```

4. Press `Enter`

Notice: a **new branch** starts from that node, parallel to your original conversation:

```
[root] → [You: best practices] → [AI: response] ─→ [You: decorator] → [AI: response]
                                                   ─→ [You: alternatives] → [AI: response]
```

You now have two conversation paths side by side. You can:
- **Compare** the AI's responses to different follow-ups
- **Explore** both directions independently
- **Collapse** a branch if it's not useful

---

## Step 7: Navigate the Canvas

Try these navigation actions:

| Action | How |
|--------|-----|
| **Pan** | Click and drag on empty canvas space |
| **Zoom in** | Scroll up, press `+`, or use the zoom slider |
| **Zoom out** | Scroll down, press `-`, or use the zoom slider |
| **Fit all** | Press `F` to zoom to fit all nodes |
| **Select node** | Click a node |
| **Deselect** | Press `Escape` or click empty space |
| **Drag node** | Click and drag a node's title area |

---

## Step 8: Use Keyboard Shortcuts

Speed up your workflow with these essential shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New chat (clears current canvas) |
| `Ctrl+F` | Open search |
| `Ctrl+Z` | Undo last node position change |
| `Enter` | Send message |
| `Shift+Enter` | Send with parallel debate (multiple models) |
| `Delete` / `Backspace` | Delete selected node |
| `+` | Zoom in |
| `-` | Zoom out |
| `F` | Fit canvas to view |
| `?` | Show all keyboard shortcuts |
| `Escape` | Deselect node / close overlays |

---

## Step 9: Bookmark and Organize

As your canvas grows, use bookmarks to keep track of important nodes:

1. **Right-click** a node → select **Bookmark**
2. The node gets a star icon (★)
3. Click the **Bookmarks** button (★) in the TopBar to show only bookmarked nodes
4. Click again to show all nodes

---

## Step 10: Understand Streaming Responses

Watch how the AI responds in real time:

1. Click a node and ask a question that requires a longer response
2. Observe the **typing indicator** (three animated dots) appear on the response node
3. Watch as the response appears character by character — no waiting for the full response
4. Notice: you can click **elsewhere** on the canvas while streaming continues (non-blocking)
5. Try pressing the **stop** button if you want to interrupt a response mid-stream

**Why streaming matters**: Unlike traditional chat UIs that show a loading spinner and then the full response, Mosaic's streaming lets you read the beginning of a response while the rest is still being generated. This feels faster and lets you decide early if the response is going in the right direction.

---

## Step 11: Use Undo

Mistyped a message or accidentally moved a node in the wrong place?

1. **Move a node** by dragging it to a new position
2. Press `Ctrl+Z` — the node jumps back to its previous position
3. Undo works for: node position changes, node additions, node deletions, and canvas clears
4. Undo history stores the last 50 actions

---

## Step 12: Start a New Canvas

Finished exploring and want to start fresh without losing your work?

1. Press `Ctrl+N` or click the **+** button in the TopBar
2. A new canvas tab appears with a fresh root node
3. Your previous canvas is saved automatically
4. Switch between canvases by clicking their tabs at the top
5. Rename a canvas by double-clicking its tab label

---

## Complete Cheat Sheet for First Session

| Goal | Action |
|------|--------|
| Start chatting | Click root node → type message → Enter |
| Continue conversation | Click any response → type → Enter |
| Branch | Click an earlier response → type different follow-up |
| Pan canvas | Drag empty space |
| Zoom | Scroll or + / - keys |
| Fit all | Press F |
| Delete a node | Select it → press Delete |
| Bookmark a node | Right-click → Bookmark |
| Open search | Ctrl+F |
| Undo | Ctrl+Z |
| Settings | Click gear icon (⚙️) |
| New canvas | Ctrl+N |

---

## What's Next?

You've completed your first conversation with Mosaic! Here's what to try next:

- [[Tutorial - Running Code Inline]] — Run JavaScript and Python directly in chat
- [[Tutorial - Branching and Parallel Exploration]] — Deep dive into canvas strategies
- [[Tutorial - Using RAG with Documents]] — Upload documents and query them with AI
- [[Canvas and Node System]] — Understand all node types and operations
- [[LLM Provider Integration]] — Try different AI providers
