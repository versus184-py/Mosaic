# Tutorial: Advanced Features in Practice

This tutorial demonstrates how to combine all of Mosaic's advanced features into a single, powerful workflow. You'll start with a complex question, explore it through multiple models and branches, prune irrelevant paths, and distill the results into a synthesis.

**Estimated time**: 25 minutes

---

## Scenario

You're evaluating **database technologies** for a new application. You want to compare PostgreSQL, MongoDB, and SQLite across several dimensions. This is a perfect use case for Mosaic's advanced features.

---

## Step 1: Set Up RAG Context

First, upload any relevant documents you have:

1. Open the DocumentPanel (📄)
2. Upload any notes, requirements documents, or comparison articles you have
3. Enable RAG (toggle ON)

Even without documents, the RAG system is useful — this step shows how to combine RAG with the other features.

---

## Step 2: Start with Parallel Debate

Let's see how different models approach the comparison:

1. Open Settings → **Debate Models**
2. Select 2-3 models (e.g., Mistral Large, GPT-4o, Claude Sonnet 4)
3. Click the root node
4. Press **Shift+Enter** (not just Enter)
5. Type:

```
Compare PostgreSQL, MongoDB, and SQLite for a new web application.
Consider: performance, scalability, data modeling flexibility, ecosystem, and use cases.
```

6. Press Shift+Enter again (the text is already in the input)

You'll see multiple response nodes fan out, one for each model:

```
                    ┌── [Mistral Large: comprehensive comparison]
[You: comparison] ──┼── [GPT-4o: structured comparison with tables]
                    └── [Claude: nuanced analysis with tradeoffs]
```

---

## Step 3: Review Confidence Scores

After each response completes, look for the **confidence badge** (a number in the corner of each response node):

- Mistral Large: 92
- GPT-4o: 88
- Claude Sonnet: 95

Claude's response has the highest confidence. This might be the one to explore first, but let's branch from all of them.

---

## Step 4: Branch from Each Model

Explore each model's response by branching:

1. Click Mistral Large's response and ask about **scalability**:

```
Can you elaborate on PostgreSQL's horizontal scaling options?
```

2. Click GPT-4o's response and ask about **schema flexibility**:

```
How does MongoDB's schema-less design help in rapid prototyping?
```

3. Click Claude's response and ask about **performance**:

```
Under what conditions does SQLite outperform the other two?
```

Your canvas now has three branches:

```
[root → comparison]
  ├── [Mistral: comparison] → [You: scalability] → [AI: response]
  ├── [GPT-4o: comparison] → [You: schema] → [AI: response]
  └── [Claude: comparison] → [You: performance] → [AI: response]
```

---

## Step 5: Use Tendril Suggestions

As each branch response completes, look for **suggestion nodes** (dimmer nodes connected with dotted lines). These are AI-generated follow-up questions.

- From the scalability branch, a suggestion might be: "How does read replication work in PostgreSQL?"
- From the schema branch: "What are the trade-offs of MongoDB's document model?"
- From the performance branch: "When should you avoid SQLite?"

Click a suggestion to materialize it into a real branch. This saves you from typing follow-up questions — the AI predicts what you might want to ask next.

---

## Step 6: Add a Deep Dive

Let's go deeper on one branch:

1. Click the latest node in the scalability branch
2. Ask:

```
Show me a real-world architecture that uses PostgreSQL with horizontal scaling
```

3. After the response, ask:

```
Write a Python script that demonstrates connection pooling with PostgreSQL
using asyncpg or psycopg2
```

4. **Run the code** using the inline code execution button (▶️)

Your scalability branch now has practical code you can test immediately.

---

## Step 7: Prune Irrelevant Branches

By now, your canvas might have 8-10 nodes. Some branches may be less relevant to your goal. Let's prune:

1. Click the **Prune** button (🧹) in the TopBar
2. When asked for a goal, enter:

```
I'm trying to decide which database to use for a high-traffic web application
with flexible data requirements
```

3. Mosaic scores each leaf branch against this goal
4. Branches scoring below 40 are dimmed

For example, if the "when to avoid SQLite" branch scored 72 (relevant), but a "JSONB in PostgreSQL" tangent scored 15 (less relevant), the tangent would be dimmed.

The Prune Banner appears at the bottom. You can **Restore All** if you disagree with the pruning.

---

## Step 8: Distill the Canvas

Now distill all valuable branches into a synthesis:

1. Click the **Distill** button (🌿) in the TopBar
2. Mosaic collects all leaf nodes and sends them to the AI
3. A new **distillation node** appears with a gold border
4. Gold dashed edges connect it to all source leaves

The distillation might produce:

```
## Database Comparison Synthesis

### Winner by Use Case
- **PostgreSQL**: Best for high-traffic web apps with complex queries
  (supported by Mistral scalability deep-dive and Claude performance analysis)
  
- **MongoDB**: Best for rapid prototyping with evolving schemas
  (supported by GPT-4o schema flexibility analysis)
  
- **SQLite**: Best for embedded/single-user scenarios
  (performance branch confirms limitations at scale)

### Recommendation
For your high-traffic web application with flexible data requirements,
PostgreSQL is the strongest candidate...
```

---

## Step 9: Export the Result

Your work is now complete. Export the entire canvas:

1. Open Settings (⚙️)
2. Click **Export**
3. A JSON file downloads: `mosaic-database-comparison.json`

This file contains all nodes, edges, positions, bookmarks, and analytics. Share it with colleagues or archive it for later reference.

---

## Step 10: Import and Continue Later

To revisit this analysis:

1. Open Settings (⚙️)
2. Click **Import**
3. Select your exported JSON file
4. The entire canvas restores with all nodes, branches, and positions intact

---

## Complete Workflow Summary

```
1. Upload RAG documents (optional)
2. Parallel debate with multiple models
3. Review confidence scores
4. Branch from each model's response
5. Follow suggestion tendrils
6. Deep dive with code execution
7. Prune irrelevant branches
8. Distill into synthesis
9. Export for sharing/archiving
```

This workflow took ~25 minutes and produced:
- Multi-model analysis
- 3+ conversation branches
- Practical code examples
- AI-generated synthesis
- Exportable archive

In a linear chat interface, this would require multiple separate conversations, manual copy-pasting, and significant context-switching. Mosaic's canvas handles it all in one spatial view.

---

## Next Steps

- [[Tutorial - Customizing Mosaic]] — Fine-tune system prompts, temperature, and theme
- [[Advanced AI Features]] — Deep dive into each feature's technical details
- [[Overall Architecture and Data Flow]] — How features interact under the hood
