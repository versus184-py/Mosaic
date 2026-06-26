# Advanced AI Features

Mosaic includes several advanced AI features that go beyond basic chat — confidence scoring, suggestion tendrils, branch distillation, branch pruning, and parallel debate. This page explains each feature, how to use it, and what's happening under the hood.

---

## Confidence Scoring

After each AI response, Mosaic can optionally ask the AI to **self-score** its response on a scale of 0-100.

### How It Works

1. After a response finishes streaming, a **calibration prompt** is sent to the AI:

```
Rate the confidence of your previous response on a scale of 0-100.
Consider: factual accuracy, clarity, completeness, and how well it addressed the user's question.
Respond with ONLY a number between 0 and 100.
```

2. The AI's numeric response is captured as the **confidence score**
3. A **confidence badge** is displayed on the response node showing the score
4. The score is stored in the node's `confidence` field

### Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Confidence scoring | Settings → Confidence | Enabled |

### Visual

The confidence badge appears in the top-right of response nodes:

```
┌─────────────────────┐
│ AI Response...   92 │  ← Confidence badge
│                     │
│ [content]           │
└─────────────────────┘
```

### Technical Details

- **Timeout**: 8 seconds (if the AI doesn't respond, the feature silently fails)
- **Failure behavior**: No badge is shown; no error is raised (silent fail)
- **Cost**: Each confidence check counts as one additional completion (tokens tracked in analytics)

---

## Suggestion Tendrils

After each AI response, Mosaic can automatically generate **follow-up suggestions** — potential next questions or directions the conversation could take.

### How It Works

1. After a response completes, a **generation prompt** is sent to the AI:

```
Based on our conversation, suggest 3 follow-up questions the user might want to ask next.
Return them as a JSON array of strings: ["question1", "question2", "question3"]
```

2. The resulting suggestions are rendered as **suggestion nodes**
3. Suggestion nodes connect to the parent response via a dotted **TendrilEdge**
4. They auto-dismiss after **30 seconds** if not clicked

### Interacting with Suggestions

| Action | Result |
|--------|--------|
| **Click** a suggestion node | Suggestion text is copied to the input field, ready to send (materialization) |
| **Ignore** for 30 seconds | Node auto-dismisses (removed from canvas) |
| **Use as-is** | Click, optionally edit, then press Enter |

### Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Suggestion tendrils | Settings → Tendrils | Enabled |
| Auto-dismiss | `useSuggestionTendrils` | 30 seconds |

### Visual

Suggestion nodes have a distinct appearance:
- **Dimmed** (0.45 opacity) to indicate they are tentative
- **Italic text**
- Connected with a **dotted edge** (TendrilEdge)
- No bookmark or collapse controls

### Technical Details

- **Node type**: `suggestion`
- **Edge type**: `tendrilEdge`
- **Auto-dismiss timer**: 30 seconds (setTimeout in `useSuggestionTendrils`)
- **Materialization**: On click, suggestion text is passed to the node input; the suggestion node is removed
- **Cost**: Each tendril generation counts as one completion

---

## Branch Distillation

Branch distillation **summarizes multiple conversation branches** into a single synthesis node. This is useful when you've explored several parallel paths and want to consolidate insights.

### How It Works

1. The user clicks the **Distill** button (🌿) in the TopBar
2. `useDistillation` collects all **leaf nodes** (endpoints of branches) on the canvas
3. Each leaf's conversation path is retrieved (walking up parent edges)
4. A **synthesis prompt** is constructed with all the leaf content
5. The AI streams a unified summary into a new **distillation node**
6. The distillation node is placed at the bottom-center of the canvas
7. **DistillEdges** (gold dashed lines) connect the distillation node to each source leaf

### Visual

```
[Branch 1 leaf] ───╮
                   ├── [Distillation Node] (gold border, gold edges)
[Branch 2 leaf] ───╯
```

Distillation nodes have:
- **Gold border** with pulse animation
- **Gold dashed edges** (DistillEdge)
- "Distillation" label

### When to Use Distillation

- After running parallel debate on multiple models
- After exploring several branching directions
- Before archiving a canvas — distill key insights first
- When preparing a summary for export

### Technical Details

- **Node type**: `distillation`
- **Edge type**: `distillEdge`
- **Leaf collection**: BFS traversal to find all leaf nodes
- **Prompt construction**: All leaf conversation paths are concatenated with labels
- **Streaming**: The distillation response streams into the new node

---

## Branch Pruning

Branch pruning uses **AI-driven relevance scoring** to dim low-value branches, reducing visual clutter on large canvases.

### How It Works

1. The user clicks the **Prune** button (🧹) in the TopBar
2. A dialog asks for a **pruning goal** — what's the user's primary objective?
3. `useBranchPruning` sends each leaf branch's content to the AI with a scoring prompt
4. Each branch receives a **relevance score** (0-100) against the goal
5. Branches with scores **below 40** are marked as `pruned: true`
6. Pruned nodes are **dimmed** (opacity reduced, edges faded)
7. A **Prune Banner** appears at the bottom of the canvas

### Visual Effects

| Element | Normal | Pruned |
|---------|--------|--------|
| Node | Full opacity | Reduced opacity |
| Edge | Full opacity | Reduced opacity (0.3) |
| Dash pattern | Solid | Modified dash |

### Restoring Pruned Branches

Click **Restore All** on the Prune Banner to un-prune all branches. Pruning is non-destructive — it only changes visual properties, the data is preserved.

### Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Prune threshold | `useBranchPruning` | 40 |
| Prune state | `pruneStore` | Transient (not persisted) |

### When to Prune

- After extensive branching when the canvas becomes cluttered
- When you have a specific goal and want to focus on relevant branches
- Before distillation — pruned branches can be excluded from synthesis

---

## Parallel Debate

Parallel debate sends the **same user input** to **multiple AI models simultaneously** and displays all responses for side-by-side comparison.

### How It Works

1. The user selects which models to include in debates (Settings → Debate Models)
2. Type a message and press **Shift+Enter** (instead of Enter)
3. `useParallelDebate` fans out the request to all selected models via `Promise.allSettled`
4. Each model's response streams independently into its own response node
5. Response nodes are arranged in a **fan pattern** around the user's message

```
                    ┌── [Model A Response]
                    │
[User Message] ─────┼── [Model B Response]
                    │
                    └── [Model C Response]
```

### Setup

1. Open Settings → **Debate Models**
2. Select 2+ models (e.g., Mistral Large, GPT-4o, Claude Sonnet)
3. Close Settings
4. When typing, use **Shift+Enter** instead of Enter to trigger debate

### Use Cases

- **Compare reasoning styles** across different models
- **Verify factual accuracy** — if all models agree, confidence is higher
- **Cost/quality tradeoff** — compare a cheap model's output with an expensive one
- **Explore different approaches** to the same problem

### Technical Details

- **Execution**: `Promise.allSettled` — all models run in parallel
- **Failure handling**: One model failing doesn't affect others
- **Node placement**: Fan layout based on the number of models
- **Analytics**: Each response is tracked separately in analytics

---

## Feature Comparison Table

| Feature | Trigger | Cost | Persistence |
|---------|---------|------|-------------|
| Confidence scoring | Automatic after response | 1 completion per response | Stored in node data |
| Suggestion tendrils | Automatic after response | 1 completion per response | Transient (30s auto-dismiss) |
| Branch distillation | Manual (button click) | 1 completion | Persistent node |
| Branch pruning | Manual (button click + goal) | 1 completion per leaf | Visual only (reversible) |
| Parallel debate | Manual (Shift+Enter) | N completions (one per model) | Persistent nodes |

---

## Next Steps

- [[Tutorial - Advanced Features in Practice]] — End-to-end walkthrough combining all features
- [[Tutorial - Branching and Parallel Exploration]] — Deep dive into branching strategies
- [[Overall Architecture and Data Flow]] — How features interact with the streaming pipeline
