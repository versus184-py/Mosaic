let pyodideInstance: any = null;
let micropip: any = null;
let replGlobals: any = null;

const PYODIDE_VERSION = "v0.26.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

async function getPyodide() {
  if (!pyodideInstance) {
    const integrityFail = () => {
      throw new Error(`Pyodide integrity check failed. Possible supply chain compromise. Refusing to load.`);
    };
    try {
      const pyodideModule: any = await import(PYODIDE_BASE + "pyodide.mjs");
      if (!pyodideModule || typeof pyodideModule.loadPyodide !== "function") {
        integrityFail();
      }
      const loadPyodide = pyodideModule.loadPyodide;
      pyodideInstance = await loadPyodide({
        indexURL: PYODIDE_BASE,
      });
      if (!pyodideInstance || typeof pyodideInstance.runPython !== "function") {
        integrityFail();
      }
      micropip = pyodideInstance.pyimport("micropip");
    } catch (err: any) {
      if (err.message && err.message.includes("integrity")) throw err;
      throw new Error(`Failed to load Pyodide: ${err.message || "Unknown error"}`);
    }
  }
  return pyodideInstance;
}

function extractImportNames(code: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /^\s*import\s+(\S+)/gm,
    /^\s*from\s+(\S+)\s+import/gm,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1].split(".")[0];
      names.add(name);
    }
  }
  return [...names];
}

const PLATFORM_MODULES = new Set([
  "msvcrt", "termios", "fcntl", "tty", "pwd", "grp", "curses",
  "winreg", "win32api", "win32con", "win32file", "pywin32",
  "ctypes", "signal", "mmap",
]);

const ALLOWED_PIP_PACKAGES = new Set([
  "numpy", "scipy", "pandas", "matplotlib", "sympy", "requests",
  "beautifulsoup4", "lxml", "Pillow", "PIL", "markdown",
  "jinja2", "pyyaml", "toml", "colorama", "tqdm",
]);

function isPipCommand(code: string): { isPip: boolean; packageName: string } {
  const trimmed = code.trim();
  const match = trimmed.match(/^(?:!)?pip\s+install\s+(\S+)/);
  if (match) {
    const pkg = match[1].split(/[<>=!@]/)[0];
    return { isPip: true, packageName: pkg };
  }
  return { isPip: false, packageName: "" };
}

let currentExecId: string | null = null;
let originalWorkerFetch: typeof self.fetch | null = null;

function createSandboxedGlobals(): Record<string, unknown> {
  const allowedModules = new Set([
    "Math", "Date", "JSON", "String", "Number", "Boolean", "Array",
    "Object", "Map", "Set", "WeakMap", "WeakSet", "Promise",
    "RegExp", "Error", "TypeError", "RangeError", "SyntaxError",
    "ReferenceError", "URIError", "parseInt", "parseFloat",
    "isNaN", "isFinite", "NaN", "Infinity", "undefined",
    "encodeURI", "encodeURIComponent", "decodeURI", "decodeURIComponent",
    "console", "setTimeout", "clearTimeout", "setInterval",
    "clearInterval", "ArrayBuffer", "Uint8Array", "Int8Array",
    "Uint16Array", "Int16Array", "Uint32Array", "Int32Array",
    "Float32Array", "Float64Array", "BigInt", "BigInt64Array",
    "BigUint64Array", "DataView", "Symbol", "globalThis",
    "TextEncoder", "TextDecoder", "atob", "btoa",
  ]);

  const blockedAPIs: Record<string, () => never> = {
    fetch: () => { throw new Error("Network requests are blocked in sandboxed code execution"); },
    XMLHttpRequest: () => { throw new Error("Network requests are blocked in sandboxed code execution"); },
    WebSocket: () => { throw new Error("WebSocket is blocked in sandboxed code execution"); },
    import: () => { throw new Error("Dynamic import is blocked in sandboxed code execution"); },
    Worker: () => { throw new Error("Worker creation is blocked in sandboxed code execution"); },
    SharedWorker: () => { throw new Error("Worker creation is blocked in sandboxed code execution"); },
    localStorage: () => { throw new Error("localStorage access is blocked in sandboxed code execution"); },
    sessionStorage: () => { throw new Error("sessionStorage access is blocked in sandboxed code execution"); },
    open: () => { throw new Error("window.open is blocked in sandboxed code execution"); },
    close: () => { throw new Error("window.close is blocked in sandboxed code execution"); },
    postMessage: () => { throw new Error("postMessage is blocked in sandboxed code execution"); },
  };

  const sandbox: Record<string, unknown> = {};
  for (const name of allowedModules) {
    sandbox[name] = (self as any)[name];
  }
  sandbox.console = {
    log: (...args: unknown[]) => (self as any)._sandboxLogs.push(args.map((a) => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
    warn: (...args: unknown[]) => (self as any)._sandboxLogs.push("warn: " + args.map(String).join(" ")),
    error: (...args: unknown[]) => (self as any)._sandboxLogs.push("error: " + args.map(String).join(" ")),
    info: (...args: unknown[]) => (self as any)._sandboxLogs.push("info: " + args.map(String).join(" ")),
  };
  for (const [name, blocker] of Object.entries(blockedAPIs)) {
    sandbox[name] = blocker;
  }
  return sandbox;
}

function executeSandboxedJS(code: string): { result?: unknown; error?: string; logs: string[] } {
  const logs: string[] = [];
  (self as any)._sandboxLogs = logs;

  const globals = createSandboxedGlobals();
  const keys = Object.keys(globals);
  const values = Object.values(globals);

  patchPyodideNetwork();
  try {
    const fn = new Function(...keys, `"use strict";\n${code}`);
    const result = fn(...values);
    return { result, logs };
  } catch (err: any) {
    return { error: err.message, logs };
  } finally {
    delete (self as any)._sandboxLogs;
    restoreNetwork();
  }
}

function patchNetworkBlockAll() {
  if (!originalWorkerFetch) {
    originalWorkerFetch = self.fetch.bind(self);
  }
  self.fetch = async () => { throw new Error("Network access is blocked in sandboxed code execution."); };
}

function patchPyodideNetwork() {
  if (!originalWorkerFetch) {
    originalWorkerFetch = self.fetch.bind(self);
  }
  const allowedHosts = [
    "cdn.jsdelivr.net",
    "pyodide-cdn2.iodide.io",
    "files.pythonhosted.org",
  ];

  const patchedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input
      : input instanceof URL ? input.href
      : input instanceof Request ? input.url
      : String(input);
    try {
      const parsed = new URL(url);
      if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
        throw new Error(`Network access to '${parsed.hostname}' is blocked for security. Only Pyodide CDN and PyPI are allowed.`);
      }
    } catch (e: any) {
      if (e.message.includes("Network access")) throw e;
    }
    return originalWorkerFetch!(input, init);
  };

  self.fetch = patchedFetch as typeof self.fetch;
}

function restoreNetwork() {
  if (originalWorkerFetch) {
    self.fetch = originalWorkerFetch;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const data = e.data as any;

  if (data.type === "abort") {
    if (currentExecId === data.id) {
      currentExecId = null;
    }
    return;
  }

  if (data.type === "repl_reset") {
    replGlobals = null;
    self.postMessage({ id: data.id, type: "result", output: "", result: "REPL session reset" });
    return;
  }

  const { id, lang, code } = data;
  currentExecId = id;

  if (lang === "javascript" || lang === "js") {
    try {
      const result = executeSandboxedJS(code);
      if (currentExecId !== id) return;
      if (result.error) {
        self.postMessage({ id, type: "error", error: result.error });
      } else {
        const output = result.logs.join("\n");
        const resultStr = result.result !== undefined ? String(result.result) : "";
        self.postMessage({ id, type: "result", output, result: resultStr });
      }
    } catch (err: any) {
      if (currentExecId !== id) return;
      self.postMessage({ id, type: "error", error: err.message });
    }
  } else if (lang === "python" || lang === "py") {
    try {
  patchNetworkBlockAll();

      const pyodide = await getPyodide();
      if (currentExecId !== id) return;

      const pip = isPipCommand(code);
      if (pip.isPip) {
        if (!ALLOWED_PIP_PACKAGES.has(pip.packageName)) {
          if (currentExecId !== id) return;
          self.postMessage({
            id, type: "error",
            error: `Package '${pip.packageName}' is not in the allowed list for security.\nAllowed packages: ${[...ALLOWED_PIP_PACKAGES].join(", ")}`,
          });
          return;
        }
        await micropip.install(pip.packageName);
        if (currentExecId !== id) return;
        self.postMessage({
          id, type: "result",
          output: `Installed '${pip.packageName}' via micropip`,
          result: "",
        });
        return;
      }

      const importNames = extractImportNames(code);
      for (const name of importNames) {
        if (PLATFORM_MODULES.has(name)) {
          if (currentExecId !== id) return;
          self.postMessage({
            id, type: "error",
            error: `Module '${name}' is a platform-specific C extension that is not available in browser-based Python (Pyodide).`,
          });
          return;
        }
        try {
          pyodide.pyimport(name);
        } catch {
          if (!ALLOWED_PIP_PACKAGES.has(name)) {
            if (currentExecId !== id) return;
            self.postMessage({
              id, type: "error",
              error: `Module '${name}' is not in the allowed list for security.\nAllowed packages: ${[...ALLOWED_PIP_PACKAGES].join(", ")}`,
            });
            return;
          }
          try {
            await micropip.install(name);
          } catch {
            if (currentExecId !== id) return;
            self.postMessage({
              id, type: "error",
              error: `Module '${name}' could not be installed. It may require native OS libraries or not have a Pyodide-compatible wheel.`,
            });
            return;
          }
        }
      }

      const isRepl = data.type === "repl_exec";
      let globalsDict = isRepl && replGlobals ? replGlobals : pyodide.toPy({});

      const stdout: string[] = [];
      pyodide.setStdout({ batched: (s: string) => stdout.push(s) });
      pyodide.setStderr({ batched: (s: string) => stdout.push(s) });

      const result = await pyodide.runPythonAsync(code, { globals: globalsDict });

      if (isRepl) {
        replGlobals = globalsDict;
      }

      if (currentExecId !== id) return;
      const output = stdout.join("\n");
      const resultStr = result !== undefined && result !== null ? pyodide.globals.get("str")(result).valueOf() : "";
      self.postMessage({ id, type: "result", output: output + (resultStr ? (output ? "\n" : "") + resultStr : ""), result: resultStr });
    } catch (err: any) {
      if (currentExecId !== id) return;
      const msg = err.message || String(err);
      if (msg.includes("ModuleNotFoundError")) {
        const match = msg.match(/No module named '([^']+)'/);
        const modName = match ? match[1] : "unknown";
        self.postMessage({
          id, type: "error",
          error: `${msg}\n\nTry: pip install ${modName}`,
        });
      } else {
        self.postMessage({ id, type: "error", error: msg });
      }
    } finally {
      restoreNetwork();
    }
  } else {
    self.postMessage({ id, type: "error", error: `Unsupported language: ${lang}` });
  }
};

self.onerror = (err: any) => {
  if (currentExecId) {
    self.postMessage({ id: currentExecId, type: "error", error: String(err) });
  }
};

self.onunhandledrejection = (err: any) => {
  if (currentExecId) {
    self.postMessage({ id: currentExecId, type: "error", error: String(err.reason) });
  }
};
