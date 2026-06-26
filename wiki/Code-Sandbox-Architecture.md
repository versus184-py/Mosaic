# Code Sandbox Architecture

Mosaic's code execution system runs **JavaScript** and **Python** in a secure, sandboxed environment. All code executes in a **Web Worker** with strict security restrictions, preventing access to network, filesystem, and browser APIs.

---

## Architecture Overview

```
Main Thread                    Web Worker
┌──────────────┐              ┌─────────────────────────┐
│  codeRunner   │───postMessage──►│  codeWorker.ts          │
│  (interface)  │              │                         │
│              │◄──postMessage──│  JS: new Function()     │
│  runCode()   │              │  Python: Pyodide WASM    │
│  replExec()  │              │                         │
│  replReset() │              │  Sandbox restrictions:   │
└──────────────┘              │  - No fetch/XHR/WS      │
                              │  - No localStorage/DOM  │
                              │  - No import()          │
                              │  - Allowlisted globals  │
                              │  - 30s timeout          │
                              └─────────────────────────┘
```

### Why a Web Worker?

- **Isolation**: The worker runs in a separate global scope — no access to the main thread's DOM, stores, or API keys
- **No blocking**: Long-running code doesn't block the UI (the canvas remains interactive)
- **Abort support**: The worker can be terminated or messages aborted without affecting the main app
- **Security boundary**: Even if malicious code breaks out of the sandbox, it's still confined to the worker scope

---

## Worker Communication Protocol

Messages between the main thread and worker follow a strict protocol:

### Main → Worker

```typescript
{
  exec_id: string;      // Unique execution ID (UUID)
  type: 'execute' | 'repl_exec' | 'repl_reset' | 'terminate';
  lang: 'javascript' | 'python';
  code: string;
}
```

### Worker → Main

```typescript
{
  exec_id: string;          // Matches the request's exec_id
  type: 'stdout' | 'result' | 'error' | 'ready';
  data: string;             // Output text
}
```

| Message Type | When Sent | Data |
|-------------|-----------|------|
| `stdout` | During execution (console.log/print) | Captured output text |
| `result` | Execution completed successfully | Return value or "undefined" |
| `error` | Execution threw an error | Error message and stack trace |
| `ready` | Worker initialized and Pyodide loaded | "ready" |

### Flow

```
1. Main thread: postMessage({ exec_id: "abc123", lang: "javascript", code: "..." })
2. Worker: Execute code
3. Worker: postMessage({ exec_id: "abc123", type: "stdout", data: "Hello" })
4. Worker: postMessage({ exec_id: "abc123", type: "result", data: "undefined" })
5. Main thread: Resolve promise with collected output/result
```

---

## JavaScript Sandbox

### Execution Model

JavaScript code is executed using `new Function()`:

```javascript
const fn = new Function(...sandboxGlobals.keys(), code);
return fn(...sandboxGlobals.values());
```

This creates a function with explicit parameters for each allowed global. Any reference to a non-param variable throws a ReferenceError.

### Allowlisted Globals (40+)

```javascript
const SANDBOX_GLOBALS = [
  // Primitives
  'Array', 'Object', 'String', 'Number', 'Boolean',
  'BigInt', 'Symbol', 'undefined', 'null', 'NaN', 'Infinity',
  
  // Collections
  'Map', 'Set', 'WeakMap', 'WeakSet',
  
  // Typed arrays
  'ArrayBuffer', 'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array',
  'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  
  // Math & time
  'Math', 'Date', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  
  // JSON
  'JSON', 'structuredClone',
  
  // ReGExp
  'RegExp', 'Error', 'TypeError', 'RangeError', 'SyntaxError',
  
  // Async
  'Promise',
  
  // Utilities
  'console', 'Reflect', 'Proxy',
  
  // Encoding
  'decodeURI', 'encodeURI', 'decodeURIComponent', 'encodeURIComponent',
  
  // Timers (limited)
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
];
```

### Blocked APIs

Any attempt to use these APIs throws a ReferenceError:

| Category | Blocked APIs |
|----------|-------------|
| **Network** | `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` |
| **Workers** | `Worker`, `SharedWorker`, `ServiceWorker` |
| **Storage** | `localStorage`, `sessionStorage`, `indexedDB`, `caches`, `cookie` |
| **DOM** | `document`, `window`, `self`, `globalThis`, `navigator`, `location`, `history` |
| **I/O** | `open`, `close`, `print`, `prompt`, `alert`, `confirm` |
| **Messaging** | `postMessage`, `BroadcastChannel`, `MessageChannel` |
| **Dynamic import** | `import()`, `importScripts()` |
| **File system** | `FileReader`, `FileWriter`, `showOpenFilePicker` |

### Timer Limitations

- `setTimeout` and `setInterval` are allowed but limited to the worker's event loop
- They cannot access the main thread's DOM or stores
- Animation-related APIs (`requestAnimationFrame`) are not available in workers

---

## Python Sandbox (Pyodide)

### Execution Model

Python code runs via **Pyodide v0.26.2** — a build of CPython compiled to WebAssembly. Pyodide is loaded from the CDN on first use.

```python
# This works:
import numpy as np
print(np.array([1,2,3]).mean())

# This is blocked:
import os  # Most os functions raise errors
import socket  # Not available in WASM

# This is restricted:
import requests  # Only allowlisted hosts
```

### Allowlisted Pip Packages

Only these packages can be installed via `pip install`:

```
numpy
pandas
scipy
matplotlib
sympy
requests
beautifulsoup4
lxml
Pillow
markdown
jinja2
pyyaml
toml
colorama
tqdm
```

The allowlist is enforced by wrapping the Pyodide `loadPackage` and micropip `install` functions.

### Network Restrictions

Python's network access is patched to only allow specific CDN hosts:

```
cdn.jsdelivr.net
pyodide-cdn2.iodide.io
files.pythonhosted.org
```

How it works:
1. The worker patches Python's `urllib` and `http.client` modules
2. Any request to a non-allowlisted host is blocked with a SecurityError
3. `fetch` in JavaScript (for Pyodide module loading) is similarly restricted

This ensures:
- Pyodide can load its runtime from CDN
- pip can install allowlisted packages from PyPI
- User code cannot make arbitrary network requests

### Blocked Platform Modules

Platform-specific C extensions that could provide system access are blocked:

```
msvcrt    (Windows console I/O)
termios   (Unix terminal I/O)
fcntl     (Unix file control)
mmap      (Memory mapping)
ctypes    (C foreign function interface) — partially restricted
```

### stdout/stderr Capture

Python's stdout and stderr are captured via Pyodide's built-in redirection:

```python
import sys
from io import StringIO

# Mosaic captures:
print("This goes to stdout")
sys.stderr.write("This goes to stderr")
```

Both streams are sent back to the main thread as `stdout` messages.

---

## Execution Lifecycle

### Single Execution

```
runCode(lang, code)
  │
  ├── Create execution ID
  ├── Set timeout (30 seconds)
  ├── postMessage to worker
  ├── Wait for messages:
  │   ├── stdout → collect in output buffer
  │   ├── result → resolve promise with output
  │   └── error → reject promise with error
  ├── On timeout → abort & reject
  └── Return { output, error?, executionTime? }
```

### REPL Execution

```
replExec(code)       replReset()
  │                      │
  ├── Same as runCode    ├── Clears Python globals
  ├── But persists       └── Returns fresh environment
  │   state in worker
  │   (global variables,
  │   imported modules)
  │
  └── State persists
      across calls
```

### Timeout Handling

```javascript
const TIMEOUT_MS = 30000;

const timeoutId = setTimeout(() => {
  worker.terminate();         // Kill the worker
  worker = createWorker();    // Create a new one
  reject(new Error('Execution timed out'));
}, TIMEOUT_MS);
```

If code exceeds 30 seconds:
1. The worker is **terminated** (killed entirely)
2. A **new worker** is created (clean state)
3. The promise rejects with a timeout error
4. The node shows an error state with retry option

---

## Security Analysis

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Code reads API keys from localStorage | Worker has no access to main thread's localStorage |
| Code makes unauthorized API calls | CSP blocks connect-src; worker's fetch is patched |
| Code accesses filesystem | Worker has no filesystem access |
| Code consumes unlimited CPU | 30-second timeout, worker can be terminated |
| Code reads other canvas data | Worker has no access to stores or DOM |
| Code breaks out of Function() sandbox | Still confined to Worker scope (no DOM access) |

### Defense in Depth

Mosaic uses multiple layers of security:

1. **Tauri CSP** — Browser-level content security policy restricts network access
2. **Web Worker isolation** — Separate global scope, no DOM access
3. **JavaScript Function sandbox** — Explicit allowlist of globals
4. **Python restrictions** — Allowlisted packages, blocked modules
5. **CDN allowlist** — Network fetch restricted to trusted hosts
6. **Pyodide integrity** — Module loading includes integrity checks
7. **Execution timeout** — Prevents infinite loops from hanging the app
8. **Confirmation dialog** — User must confirm AI-generated code execution

---

## codeRunner.ts API

```typescript
interface CodeRunner {
  runCode(lang: CodeLanguage, code: string): Promise<CodeResult>;
  replExec(code: string): Promise<CodeResult>;
  replReset(): Promise<void>;
  terminateWorker(): void;
}

interface CodeResult {
  output: string;           // All captured stdout
  error?: string;           // Error message (if failed)
  executionTime?: number;   // Duration in ms
}

type CodeLanguage = 'javascript' | 'python';
```

### Usage Examples

```typescript
import { runCode, replExec, replReset } from '@/utils/codeRunner';

// One-shot JavaScript
const result = await runCode('javascript', `
  const numbers = [1, 2, 3, 4, 5];
  console.log('Sum:', numbers.reduce((a, b) => a + b));
`);
console.log(result.output); // "Sum: 15"

// One-shot Python
const pyResult = await runCode('python', `
  import numpy as np
  arr = np.array([1, 2, 3, 4, 5])
  print(f"Mean: {arr.mean():.2f}")
`);
console.log(pyResult.output); // "Mean: 3.00"

// Persistent REPL
await replExec('x = 42');
const replResult = await replExec('print(x * 2)');
console.log(replResult.output); // "84"

// Reset REPL
await replReset();
```

---

## Next Steps

- [[Tutorial - Running Code Inline]] — Step-by-step code execution walkthrough
- [[Security Model]] — Complete security overview (CSP, sandboxing, validation)
- [[PythonTerminal]] component in [[Component API Reference]] — REPL widget details
