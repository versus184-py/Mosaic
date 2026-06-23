import { useCallback } from "react";
import { useRagStore, type RagDocument } from "../store/ragStore";

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".json", ".csv", ".xml", ".yaml", ".yml",
  ".py", ".js", ".ts", ".jsx", ".tsx", ".rs", ".go", ".java",
  ".c", ".cpp", ".h", ".hpp", ".css", ".html", ".sh", ".bat",
]);

function chunkText(text: string, maxChunkSize = 800, overlap = 100): string[] {
  if (!text) return [];
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const boundary = text.lastIndexOf("\n", end);
      if (boundary > start + maxChunkSize / 2) {
        end = boundary;
      } else {
        const sentenceBoundary = text.lastIndexOf(". ", end);
        if (sentenceBoundary > start + maxChunkSize / 2) {
          end = sentenceBoundary + 1;
        }
      }
    }
    chunks.push(text.slice(start, Math.min(end, text.length)));
    start = end - overlap;
  }
  return chunks;
}

export function useDocumentParser() {
  const addDocument = useRagStore((s) => s.addDocument);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const parseFile = useCallback(async (file: File): Promise<void> => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!TEXT_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB`);
    }

    const text = await file.text();
    const chunks = chunkText(text).map((t, i) => ({ text: t, index: i }));

    addDocument({
      name: file.name,
      type: ext,
      size: file.size,
      chunks,
    });
  }, [addDocument]);

  const parseFiles = useCallback(async (files: FileList | File[]): Promise<{ success: number; errors: string[] }> => {
    let success = 0;
    const errors: string[] = [];
    const promises = Array.from(files).map(async (file) => {
      try {
        await parseFile(file);
        success++;
      } catch (e: any) {
        errors.push(`${file.name}: ${e.message}`);
      }
    });
    await Promise.all(promises);
    return { success, errors };
  }, [parseFile]);

  return { parseFile, parseFiles };
}
