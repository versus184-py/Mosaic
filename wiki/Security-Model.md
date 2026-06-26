# Security Model

Mosaic takes security seriously. The application employs **defense in depth** — multiple independent security layers that protect users even if one layer is compromised.

---

## Security Layers

```
Layer 1: Tauri CSP (Browser-level policy)
Layer 2: Tauri Capabilities (System-level permissions)
Layer 3: Web Worker Isolation (Code execution sandbox)
Layer 4: JavaScript/Python Sandboxes (Language-level restrictions)
Layer 5: Data Validation (Input sanitization)
Layer 6: API Key Encryption (Storage protection)
```

---

## Layer 1: Content Security Policy (CSP)

The CSP is enforced at the Tauri level in `tauri.conf.json`:

```json
{
  "security": {
    "csp": "default-src 'self';
            script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
            worker-src 'self' blob: https://cdn.jsdelivr.net;
            connect-src 'self' https://api.mistral.ai
                         https://api.openai.com
                         https://api.anthropic.com
                         https://generativelanguage.googleapis.com
                         https://cdn.jsdelivr.net
                         https://files.pythonhosted.org
                         https://pyodide-cdn2.iodide.io
                         http://localhost:11434;
            img-src 'self' data: blob:;
            style-src 'self' 'unsafe-inline';
            font-src 'self' data:;
            frame-src 'none';
            object-src 'none';
            base-uri 'self';"
  }
}
```

### Directive Breakdown

| Directive | Policy | Purpose |
|-----------|--------|---------|
| `default-src` | `'self'` | Fallback for all resource types — only same-origin |
| `script-src` | `'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net` | Allows Pyodide WASM loading from CDN; blocks inline scripts |
| `worker-src` | `'self' blob: https://cdn.jsdelivr.net` | Allows Web Workers only from same origin or Pyodide CDN |
| `connect-src` | Provider APIs + CDNs + localhost | Restricts network requests to known safe endpoints |
| `img-src` | `'self' data: blob:` | Blocks external image loading (prevents tracking pixels) |
| `frame-src` | `'none'` | No iframes allowed |
| `object-src` | `'none'` | No plugins (Flash, Java) |
| `base-uri` | `'self'` | Prevents base URI injection |

### Why This Matters

The CSP prevents:
- **XSS attacks**: Inline scripts are blocked; only scripts from `'self'` and `cdn.jsdelivr.net` can execute
- **Data exfiltration**: `connect-src` restricts what URLs the app can contact; even if XSS succeeds, data can only go to known endpoints
- **Clickjacking**: No iframes allowed (`frame-src: 'none'`)
- **Drive-by downloads**: `object-src: 'none'` blocks plugin-based attacks

---

## Layer 2: Tauri Capabilities

Tauri v2 uses a **capability-based permission model**. Mosaic's capabilities are minimal:

```json
{
  "identifier": "default",
  "description": "Default capability set",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

Only `"core:default"` is granted. This includes basic window management, but **no**:
- File system access
- Shell/process execution
- Clipboard access
- Global shortcuts
- HTTP requests (all networking is done from the webview, not the Rust backend)

This is intentionally minimal. The Rust backend serves only as a webview container — all application logic runs in the sandboxed frontend.

---

## Layer 3: Web Worker Isolation

All user code (JavaScript and Python) executes in a **Web Worker**, which provides:

### Isolation Properties

- **No DOM access**: Workers cannot read or manipulate the DOM
- **No store access**: Workers cannot access Zustand stores or localStorage
- **Separate global scope**: Workers have their own global scope, separate from the main thread
- **Message-based communication**: Workers communicate with the main thread only via `postMessage`
- **Terminable**: Workers can be terminated at any time, killing all running code

### Worker Security Boundaries

```
Main Thread (privileged)              Web Worker (sandboxed)
┌──────────────────────────┐         ┌──────────────────────┐
│  API keys (in memory)     │         │  Only receives:      │
│  Canvas data (stores)     │         │  - exec_id           │
│  localStorage (all data)  │         │  - lang              │
│  DOM (full access)        │  msg   │  - code              │
│  fetch (unrestricted)     │◄───────►│  - stdout/result     │
│  Node.js file system      │         │  - No DOM/stores     │
└──────────────────────────┘         └──────────────────────┘
```

Even if malicious code breaks out of the JavaScript/Python sandbox, it's still confined to the Worker scope and cannot access sensitive data on the main thread.

---

## Layer 4: Code Sandboxes

### JavaScript Sandbox

JavaScript code is executed via `new Function()` with explicit parameter injection:

```javascript
// Safe: Every global must be explicitly passed
const fn = new Function(
  'Math', 'Date', 'JSON', 'console',
  // ... 40+ allowlisted globals
  code
);
return fn(Math, Date, JSON, console, /* ... */);
```

Any reference to a non-passed symbol (like `fetch`, `document`, `localStorage`, `process`) throws a `ReferenceError`. This is a **strict allowlist approach** — everything is blocked by default, only explicitly listed symbols are available.

**Blocked APIs**: fetch, XMLHttpRequest, WebSocket, Worker, SharedWorker, localStorage, sessionStorage, indexedDB, open, close, import(), Document, Window, Navigator, Location, History, Screen.

### Python Sandbox

Python code runs in Pyodite (CPython in WebAssembly) with additional restrictions:

- **Pip packages**: Only 15 allowlisted packages can be installed
- **Network**: Python's `urllib`/`requests`/`http.client` are patched to only allow CDN hosts
- **Platform modules**: `msvcrt`, `termios`, `fcntl`, `mmap` are blocked or restricted
- **C extensions**: Platform-specific C extensions are blocked (they don't work in WASM anyway)
- **Execution timeout**: 30 seconds maximum

---

## Layer 5: Data Validation

All data loaded from external sources is validated before use.

### Import Validation

When importing a canvas JSON file, `validateImportedCanvas()` checks:

```typescript
function validateImportedCanvas(data: unknown): data is CanvasData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  // Must have nodes and edges arrays
  if (!Array.isArray(d.nodes) || !Array.isArray(d.edges)) return false;
  
  // Each node must have valid structure
  for (const node of d.nodes) {
    if (!node.id || !node.type || !node.position || !node.data) return false;
    if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false;
    if (!validateNodeData(node.data)) return false;
  }
  
  // Each edge must have valid structure
  for (const edge of d.edges) {
    if (!edge.id || !edge.source || !edge.target) return false;
  }
  
  return true;
}
```

### localStorage Validation

All persisted stores validate their data on load:

| Store | Validator | Behavior on Invalid Data |
|-------|-----------|------------------------|
| canvasManagerStore | `validateCanvasData()` | Reset to default (empty canvases) |
| uiStore | `validateUIState()` | Reset to default settings |
| ragStore | `validateRagDocs()` | Reset to empty document list |
| analyticsStore | None (numeric data) | Keep as-is |

---

## Layer 6: API Key Encryption

API keys are stored in localStorage using **XOR encryption** with a salt:

```typescript
const SALT = 'MosaicKeySalt';

function encryptKey(plaintext: string): string {
  let result = '';
  for (let i = 0; i < plaintext.length; i++) {
    result += String.fromCharCode(
      plaintext.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length)
    );
  }
  return btoa(result);
}

function decryptKey(encoded: string): string {
  const ciphertext = atob(encoded);
  let result = '';
  for (let i = 0; i < ciphertext.length; i++) {
    result += String.fromCharCode(
      ciphertext.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length)
    );
  }
  return result;
}
```

**Important limitations**:
- XOR encryption is **not production-grade** — it prevents casual exposure (e.g., someone looking at your localStorage)
- A determined attacker with access to the binary can extract the salt and decrypt keys
- For production use, consider OS-level credential storage (Keychain, Credential Manager, Secret Service)

### Key Caching

After decryption, API keys are cached in memory (a simple `Map<string, string>`) to avoid repeated decryption:

```typescript
const keyCache = new Map<string, string>();

function getApiKey(provider: string): string | null {
  if (keyCache.has(provider)) return keyCache.get(provider)!;
  
  const stored = localStorage.getItem(`mosaic-api-key-${provider}`);
  if (!stored) return null;
  
  const decrypted = decryptKey(stored);
  keyCache.set(provider, decrypted);
  return decrypted;
}
```

---

## Additional Security Measures

### AI-Generated Code Confirmation

Before executing AI-generated code, Mosaic shows a confirmation dialog:

```
⚠️ This code was generated by AI. Are you sure you want to run it?
[Cancel] [Run Anyway]
```

This only appears once per session for AI-generated code blocks. User-written code does not trigger the warning.

### Pyodide Integrity Checks

When loading Pyodide from the CDN, Mosaic verifies the module integrity using checksums to prevent tampering:

```typescript
const INTEGRITY_HASHES = {
  'pyodide-0.26.2': 'sha384-...',
};
```

Failed integrity checks prevent the module from loading and show an error to the user.

### No Telemetry

Mosaic does **not** collect or transmit any telemetry data:
- No analytics SDKs
- No error tracking services
- No usage statistics
- All analytics data is stored locally in localStorage

---

## Security Checklist

| Concern | Mitigated By |
|---------|-------------|
| Cross-site scripting (XSS) | CSP, no inline scripts |
| Data exfiltration | connect-src CSP, sandboxed workers |
| Malicious code execution | Worker isolation, Function sandbox, pip allowlist |
| API key theft | XOR encryption, in-memory only after decryption |
| Corrupted data crashes | Schema validation on all imports |
| Network attacks | CSP, CDN allowlist |
| Memory access | Web Worker separation |
| Extension exploits | Disabled plugins, no iframes |

---

## Reporting Vulnerabilities

If you discover a security vulnerability in Mosaic, please report it by opening a [GitHub issue](https://github.com/versus184-py/Mosaic/issues) with the label `security`. Do not publicly disclose the vulnerability until it has been addressed.

---

## Next Steps

- [[Code Sandbox Architecture]] — Deep dive into sandboxed execution
- [[Deployment and Distribution]] — How builds are secured
- [[Troubleshooting and FAQ]] — Common security-related questions
