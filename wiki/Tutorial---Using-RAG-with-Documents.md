# Tutorial: Using RAG with Documents

This tutorial walks you through Mosaic's **Retrieval-Augmented Generation (RAG)** system — uploading documents, enabling context-aware queries, and getting the most out of your data.

**Estimated time**: 15 minutes

---

## Prerequisites

Before starting, ensure:
- Mosaic is installed and running
- At least one LLM provider is configured (API key entered in Settings)
- You have a text file, markdown file, or code file ready to upload

---

## Step 1: Open the DocumentPanel

1. Click the **Documents** icon (📄) in the TopBar
2. The DocumentPanel slides in from the right side
3. You'll see an empty document list with an Upload button

---

## Step 2: Upload a Document

1. Click **Upload**
2. Select a file from your computer (supports .txt, .md, .json, .csv, .py, .js, .ts, .rs, .go, .java, .c, .cpp, .css, .html, .xml, .yaml, .yml)
3. The file is processed automatically — you'll see it appear in the list

### What Happens During Upload

1. The file is read as text
2. The text is split into **chunks** of 800 characters with 100 characters of overlap
3. Each chunk is stored with metadata (source filename, chunk index)
4. The document appears in the panel with:
   - Filename
   - File size
   - Number of chunks created

### Example

Upload a file called `my-notes.txt` (3,200 characters). It will be split into approximately 5 chunks (800 × 4 = 3,200 + overlap).

---

## Step 3: Enable RAG

Toggle the **RAG Enable** switch in the DocumentPanel:

- **ON**: The top 3 most relevant chunks from your documents are automatically included with every AI query
- **OFF**: Documents are stored but not searched

Make sure it's toggled **ON**.

---

## Step 4: Ask Questions About Your Document

Now ask the AI questions about your uploaded content:

1. Click the root node (or any existing node)
2. Type a question related to your document, for example:

```
What are the key points about error handling mentioned in my notes?
```

3. Press Enter

The AI's response should reference content from your document. Unlike a normal query (where the AI relies only on its training data), the RAG system has injected relevant context from your uploaded file.

---

## Step 5: Compare RAG vs Non-RAG Responses

To see the difference RAG makes:

1. Toggle RAG **OFF** in the DocumentPanel
2. Ask the same question again (branch from an earlier node)

```
What are the key points about error handling mentioned in my notes?
```

3. Note the difference: without RAG, the AI has no access to your document and may respond generically (or state it doesn't have access to your notes).

4. Toggle RAG back **ON** for continued context-aware queries.

---

## Step 6: Upload Multiple Documents

For richer context, upload several related documents:

1. Upload a code file (e.g., `api-handler.py`)
2. Upload a documentation file (e.g., `api-docs.md`)
3. Upload a notes file (e.g., `meeting-notes.txt`)

Now when you ask questions, the RAG system searches across **all** documents and returns the 3 most relevant chunks regardless of source.

### Example Cross-Document Query

```
What's the relationship between the error handling strategy in api-handler.py
and the requirements in the meeting notes?
```

The AI can synthesize information across all your documents.

---

## Step 7: Use RAG with Branching

RAG works seamlessly with branching:

1. Branch from a RAG-informed response
2. Ask a follow-up that drills deeper into the document content
3. Each branch query independently searches for relevant chunks

This means each branch gets context tailored to its specific question, even when exploring different aspects of the same document.

---

## Step 8: RAG + Code Execution

Combine RAG with code execution for powerful workflows:

1. Upload a data file (e.g., `sales-data.csv`)
2. Ask: `Analyze the sales trends in my data`
3. The AI sees the data context and can generate analysis code
4. Run the generated Python code inline to see actual analysis

Example:

```
Based on the sales data in the CSV I uploaded, write a Python script
using pandas to calculate monthly totals and identify the best-performing month.
```

The AI will: (1) reference your document context, (2) write appropriate code, and (3) you can run it to see results.

---

## Managing the Document Library

### Viewing Document Details

Click the expand arrow on any document entry to see:
- Number of chunks
- Individual chunk previews

### Removing Documents

Click the delete icon (trash) next to a document to remove it. Its chunks are immediately removed from the search index.

### Clearing All Documents

Click **Clear All** to remove all documents. A confirmation dialog appears.

### Storage Limits

| Limit | Value | What Happens When Exceeded |
|-------|-------|---------------------------|
| Max documents | 50 | Upload is rejected with a message |
| Max total size | 50 MB | Upload is rejected |
| Max per file | 10 MB | File is rejected |

---

## Troubleshooting

### "The AI doesn't seem to know about my document"

| Possible Cause | Solution |
|---------------|----------|
| RAG is toggled OFF | Check the toggle in DocumentPanel |
| Query doesn't match document content | Try rephrasing with keywords from the document |
| Embedding API is down | Mosaic falls back to TF-IDF, which is less semantically accurate |
| Document is too large | Check that it's under 10 MB |
| Document format not supported | Check the supported formats list |

### "Only some documents are being searched"

The RAG system returns the **top 3 chunks** across all documents. If you have many documents, some may not be represented in the top results. Try more specific queries.

### "Chunks seem too small"

The default chunk size of 800 characters works well for most use cases. If you need larger context, consider:
- Breaking your document into smaller files focused on specific topics
- Using more specific queries that match fewer, more relevant chunks

---

## Advanced: Understanding the RAG Pipeline

```
Query: "What is the error handling strategy?"

1. Query → Embedding API → Query Vector
   (or TF-IDF vector if embeddings unavailable)

2. For each chunk:
   similarity = cosine(vector_query, vector_chunk)

3. Top 3 chunks selected

4. Context injected into system prompt:
   [RELEVANT CONTEXT]
   Source: api-docs.md
   The error handling strategy uses circuit breakers...

5. AI generates response with context
```

See the [[RAG System Guide]] for a complete technical explanation.

---

## Next Steps

- [[RAG System Guide]] — Technical deep dive into the RAG system
- [[Advanced AI Features]] — Combine RAG with distillation, pruning, and debate
- [[Tutorial - Advanced Features in Practice]] — Full workflow combining all features
