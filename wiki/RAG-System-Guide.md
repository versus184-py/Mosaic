# RAG System Guide

Mosaic's **Retrieval-Augmented Generation (RAG)** system lets you upload documents and have the AI draw relevant context from them when answering questions. This turns Mosaic into a powerful tool for working with your own data — research papers, codebases, documentation, meeting notes, and more.

---

## How RAG Works

The RAG pipeline has three phases:

### Phase 1: Document Ingestion

```
Upload File → Read Text → Chunk (800 chars, 100 overlap) → Store in ragStore
```

When you upload a document:
1. The file is read as text
2. `useDocumentParser` splits the text into **chunks** of 800 characters with 100-character overlap (this means each chunk shares 100 characters with the previous one, ensuring context isn't lost at boundaries)
3. Chunks are stored in the `ragStore` with metadata (filename, size, chunk index)
4. The document appears in the DocumentPanel

### Phase 2: Query-Time Search

```
User sends message → Check if RAG enabled → Search top 3 chunks → Append to system prompt
```

When you send a message with RAG enabled:
1. The user's input is used as a search query
2. `ragStore.searchChunks(query, 3)` finds the 3 most relevant chunks
3. Relevance is determined by **cosine similarity**:
   - **Primary**: Embedding cosine similarity (using any connected provider's embedding API)
   - **Fallback**: TF-IDF cosine similarity (statistical, no external API needed)
4. The top 3 chunks are formatted as context and appended to the system prompt

### Phase 3: Augmented Generation

```
System Prompt + RAG Context + User Message → AI → Context-Aware Response
```

The AI receives the full context and generates a response informed by your documents.

---

## Supported File Formats

Mosaic supports 25+ file formats through the DocumentPanel upload dialog:

| Category | Extensions |
|----------|-----------|
| Plain text | `.txt` |
| Markdown | `.md` |
| Data | `.json`, `.csv`, `.xml`, `.yaml`, `.yml`, `.toml` |
| Python | `.py` |
| JavaScript/TypeScript | `.js`, `.jsx`, `.ts`, `.tsx` |
| Rust | `.rs` |
| Go | `.go` |
| Java | `.java` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp` |
| Web | `.css`, `.html` |
| Other | `.pdf` (text extraction) |

---

## Limits and Constraints

| Limit | Value | Enforcement |
|-------|-------|-------------|
| Max documents per canvas | 50 | `ragStore` validation |
| Max total size | 50 MB | `ragStore` validation |
| Max per file | 10 MB | File picker + validation |
| Chunk size | 800 characters | `useDocumentParser` |
| Chunk overlap | 100 characters | `useDocumentParser` |
| Chunks returned per query | 3 | `searchChunks()` parameter |
| RAG context location | Appended to system prompt | `useStreamMessage` |

---

## Using the DocumentPanel

### Opening the Panel

Click the **Documents** button (📄) in the TopBar to open the DocumentPanel — a slide-in panel on the right side of the window.

### Adding Documents

1. Click **Upload** in the DocumentPanel
2. Select one or more files from your file system
3. Files are parsed and chunked automatically
4. Each document appears in the list with:
   - Filename
   - Number of chunks
   - File size

### Enabling RAG

Toggle the **RAG Enable** switch in the DocumentPanel:
- **On**: Context from relevant documents is automatically included with every AI query
- **Off**: Documents are stored but not searched (no context injection)

### Managing Documents

| Action | How |
|--------|-----|
| View document details | Click the expand arrow on a document entry |
| Remove a document | Click the delete icon next to the document |
| Clear all documents | Click **Clear All** in the DocumentPanel |

---

## Search Algorithm Details

### Embedding Search (Primary)

When available, Mosaic uses **embeddings** for semantic search:

1. The query is sent to the provider's embedding API
2. Each document chunk is also represented as an embedding vector
3. Cosine similarity is computed between the query embedding and each chunk embedding
4. The top 3 chunks with the highest similarity scores are returned

**Embedding provider priority**: Ollama → Mistral → OpenAI → Gemini

### TF-IDF Cosine Similarity (Fallback)

If no embedding provider is available, Mosaic falls back to **TF-IDF** (Term Frequency-Inverse Document Frequency):

**TF-IDF** is a statistical measure that evaluates how important a word is to a document within a collection:

```
TF(t, d) = (number of times term t appears in document d) / (total terms in document d)
IDF(t) = log(total documents / number of documents containing term t)
TF-IDF(t, d) = TF(t, d) × IDF(t)
```

1. A TF-IDF vector is computed for the query
2. A TF-IDF vector is computed for each chunk
3. Cosine similarity is computed between query vector and each chunk vector
4. The top 3 most similar chunks are returned

This is a lightweight, zero-dependency approach that works entirely in the browser without external API calls.

---

## RAG Context Injection

When RAG is enabled and a query is sent, the context is injected into the system prompt as follows:

```
[System Prompt]
...
[END SYSTEM PROMPT]

[RELEVANT CONTEXT FROM DOCUMENTS]
--- Source: filename1.txt ---
[chunk content]
--- Source: filename2.md ---
[chunk content]
--- Source: filename3.py ---
[chunk content]

User: [original query]
```

The AI sees this augmented prompt and uses the document context to inform its response.

---

## Best Practices

### For Better Search Results

- **Be specific** in your queries — vague questions return less relevant chunks
- **Use relevant documents** for each canvas — don't mix unrelated documents
- **Chunk overlapping is automatic** — you don't need to worry about context at chunk boundaries (100-character overlap handles it)

### For Large Documents

- Break very large documents (100K+ characters) into smaller files before uploading
- Consider the 10 MB per-file limit when preparing documents
- For codebases, upload individual files rather than combining them

### When RAG Seems Unhelpful

- Check that RAG is enabled (toggle in DocumentPanel)
- Verify that your query relates to the uploaded documents
- If embedding search fails, Mosaic falls back to TF-IDF — results may be less semantically accurate
- Try rephrasing your query with keywords from the documents

---

## Under the Hood

The RAG system is implemented across several files:

| File | Role |
|------|------|
| `src/store/ragStore.ts` | Document/chunk storage, search implementation |
| `src/hooks/useDocumentParser.ts` | File reading and chunking logic |
| `src/hooks/useStreamMessage.ts` | Context injection during message streaming |
| `src/components/ui/DocumentPanel.tsx` | UI for document management |
| `src/api/providers.ts` | `embedTexts()` for embedding search |

The `ragStore` persists to `localStorage` under the key `mosaic-rag`. When loading stored data, `validateRagDocs()` ensures the data integrity before use.

---

## Next Steps

- [[Advanced AI Features]] — Combine RAG with distillation, pruning, debate
- [[Tutorial - Using RAG with Documents]] — Step-by-step walkthrough
- [[Security Model]] — How document data is protected
