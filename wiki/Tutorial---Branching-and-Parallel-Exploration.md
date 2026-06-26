# Tutorial: Branching and Parallel Exploration

This tutorial explores Mosaic's core feature — **conversation branching** — in depth. You'll learn strategies for effective branching, how to compare parallel paths, and how to manage complex conversation trees.

**Estimated time**: 20 minutes

---

## Why Branch?

Traditional AI chats are linear: you ask, the AI answers, you ask again. This works for sequential tasks but fails when you want to:

- **Compare approaches**: "Write this function in Python vs JavaScript"
- **Explore tangents**: "What about this alternative interpretation?"
- **Iterate on details**: "Refine this specific part while keeping the rest"
- **Backtrack**: "Go back to that earlier point and try a different direction"

Mosaic's canvas solves all of these. Every node is a potential fork.

---

## Step 1: Set Up a Base Conversation

Start with a question that has multiple valid approaches:

1. Click the root node
2. Type: `What are different approaches to handling errors in API design?`
3. Press Enter and wait for the AI's response

The AI will likely discuss several approaches (HTTP status codes, retry strategies, circuit breakers, etc.).

---

## Step 2: Branch from a Specific Point

Now, instead of continuing linearly, branch from the AI's response:

1. Click on the AI's response node
2. Type: `Explain the circuit breaker pattern in detail with a code example`
3. Press Enter

This creates a new branch exploring one specific topic from the response.

---

## Step 3: Create a Second Branch

Go back to the original response and create a different branch:

1. Again click the **same** AI response node (the original one)
2. Type: `Compare REST and GraphQL error handling approaches`
3. Press Enter

Now you have:

```
[root] → [You: API design approaches] → [AI: response]
                                              ├── [You: circuit breaker] → [AI: response]
                                              └── [You: REST vs GraphQL] → [AI: response]
```

You can now **drag the nodes** to arrange them side by side for comparison.

---

## Step 4: Compare Responses

With two parallel branches, you can:

1. **Drag nodes**: Move the two branch responses so they sit next to each other
2. **Review side-by-side**: Read both responses to compare their approaches
3. **Continue each branch**: Click into either response and continue the conversation independently

This is impossible in a linear chat — you'd have to choose one direction and lose the other.

---

## Step 5: Deep Branching

Branches can themselves be branched. Let's go deeper:

1. Click the **circuit breaker** response node
2. Ask: `Show me a Python implementation of circuit breaker with asyncio`
3. Then click the **REST vs GraphQL** response node
4. Ask: `What tools help implement GraphQL error handling?`

Your tree now has depth:

```
[root]
  └── [AI: API design]
        ├── [You: circuit breaker] → [AI: response]
        │                               └── [You: Python asyncio] → [AI: response]
        └── [You: REST vs GraphQL] → [AI: response]
                                        └── [You: tools] → [AI: response]
```

---

## Step 6: Use Collapse to Manage Clutter

As the tree grows, you can collapse branches you don't need to see:

1. Right-click the **circuit breaker** response node
2. Select **Collapse**
3. The entire circuit breaker subtree collapses into a badge: `+2`

```
[root]
  └── [AI: API design]
        ├── [AI: circuit breaker (+2)]
        └── [You: REST vs GraphQL] → [AI: response]
                                        └── [You: tools] → [AI: response]
```

To expand: click the badge or right-click → **Expand**.

---

## Step 7: Bookmark Important Findings

As you explore, bookmark the most valuable responses:

1. Right-click a particularly insightful response
2. Select **Bookmark** (star icon appears)
3. Later, click the **Bookmarks** button (★) in the TopBar to see only bookmarked nodes
4. This is great for distilling key takeaways from a large canvas

---

## Step 8: Prune Irrelevant Branches

If some branches turned out to be less useful:

1. Click the **Prune** button (🧹) in the TopBar
2. Enter a goal, for example: `I want to learn about practical API error handling patterns`
3. Mosaic scores each branch against this goal
4. Low-scoring branches are dimmed

You can restore pruned branches anytime via the Prune Banner.

---

## Step 9: Distill Insights

When you've finished exploring, distill everything into a summary:

1. Click the **Distill** button (🌿) in the TopBar
2. Mosaic collects all leaf nodes and sends them to the AI
3. A new **distillation node** appears at the bottom of the canvas
4. It summarizes all branches into a coherent synthesis
5. Gold dashed edges connect the distillation to its source leaves

---

## Step 10: Use Parallel Debate for Multi-Model Comparison

For critical decisions, compare how different models handle the same input:

1. Open Settings → **Debate Models**
2. Select 2-3 models (e.g., Mistral Large, GPT-4o, Claude Sonnet)
3. Click a node and type your question
4. Press **Shift+Enter** instead of Enter
5. Multiple response nodes fan out, one per model

```
                           ┌── [Mistral Large response]
[You: complex question] ───┼── [GPT-4o response]
                           └── [Claude Sonnet response]
```

You can then branch from any of these responses, mix insights across models, or distill the debate into a synthesis.

---

## Branching Strategies

### Strategy 1: The Star

Create several branches from a single response to explore different angles:

```
[root] → [broad question]
              ├── [angle A]
              ├── [angle B]
              ├── [angle C]
              └── [angle D]
```

Best for: Exploring a complex topic from multiple perspectives.

### Strategy 2: The Chain

A single deep branch that goes deeper on a specific topic:

```
[root] → [question] → [follow-up] → [deep dive] → [implementation]
```

Best for: Sequential problem-solving, debugging, tutorials.

### Strategy 3: The Tree

Full branching with multiple levels, combining Star and Chain:

```
[root]
  ├── [angle A] → [deeper] → [even deeper]
  ├── [angle B] → [deeper]
  └── [angle C]
```

Best for: Complex research where you need breadth and depth.

### Strategy 4: The Debate

Use multiple models on the same input via parallel debate:

```
[question] → Mistral, GPT-4o, Claude (simultaneous)
```

Best for: Fact-checking, comparing reasoning styles, cost/quality analysis.

---

## Tips for Effective Branching

1. **Name your branches mentally** — know what each branch is exploring
2. **Collapse early** — reduce visual noise for branches you're done with
3. **Bookmark key insights** — mark responses that contain critical information
4. **Distill before archiving** — synthesize branches before moving on
5. **Use auto-layout** — press F to fit all nodes when the tree gets messy
6. **Rearrange spatially** — drag nodes to group related branches together
7. **Prune ruthlessly** — dim branches that don't serve your goal

---

## Next Steps

- [[Tutorial - Advanced Features in Practice]] — Combine all features in one workflow
- [[Tutorial - Using RAG with Documents]] — Add document context to your branches
- [[Advanced AI Features]] — Deep dive into each advanced feature
