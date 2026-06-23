type CodeResult = { output: string; result: string } | { error: string };

const workerRef: { current: Worker | null; listenerAttached: boolean } = { current: null, listenerAttached: false };
const pending = new Map<string, { resolve: (r: CodeResult) => void; reject: (reason: unknown) => void }>();

function handleWorkerMessage(e: MessageEvent) {
  const { id } = e.data;
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  if (e.data.type === "result") {
    entry.resolve({ output: e.data.output, result: e.data.result });
  } else {
    entry.resolve({ error: e.data.error });
  }
}

function getWorker(): Worker {
  if (!workerRef.current) {
    workerRef.current = new Worker(
      new URL("../workers/codeWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current.addEventListener("message", handleWorkerMessage);
  }
  return workerRef.current;
}

let callId = 0;

function nextId(): string {
  return `exec-${++callId}-${Math.random().toString(36).slice(2, 6)}`;
}

function postWithTimeout(msg: Record<string, unknown>, timeout = 30000): Promise<CodeResult> {
  const id = nextId();
  const worker = getWorker();

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });

    worker.postMessage({ id, ...msg });

    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        worker.postMessage({ type: "abort", id });
        resolve({ error: "Execution timed out" });
      }
    }, timeout);
  });
}

export function runCode(lang: string, code: string): Promise<CodeResult> {
  return postWithTimeout({ lang, code });
}

export function replExec(code: string): Promise<CodeResult> {
  return postWithTimeout({ type: "repl_exec", lang: "python", code });
}

export function replReset(): Promise<CodeResult> {
  return postWithTimeout({ type: "repl_reset" }, 0);
}

export function terminateWorker() {
  for (const [id, entry] of pending) {
    entry.reject(new Error("Worker terminated"));
  }
  pending.clear();
  if (workerRef.current) {
    workerRef.current.terminate();
    workerRef.current = null;
  }
}
