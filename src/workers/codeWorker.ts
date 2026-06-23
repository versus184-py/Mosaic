let pyodideInstance: any = null;
let micropip: any = null;
let replGlobals: any = null;

async function getPyodide() {
  if (!pyodideInstance) {
    // @ts-expect-error -- CDN import resolved at runtime by browser
    const pyodideModule: any = await import("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs");
    const loadPyodide = pyodideModule.loadPyodide;
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
    });
    micropip = pyodideInstance.pyimport("micropip");
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

function isPipCommand(code: string): { isPip: boolean; packageName: string } {
  const trimmed = code.trim();
  const match = trimmed.match(/^(?:!)?pip\s+install\s+(\S+)/);
  if (match) return { isPip: true, packageName: match[1] };
  return { isPip: false, packageName: "" };
}

let currentExecId: string | null = null;

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
    const originalLog = console.log;
    try {
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.map((a) => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
      };
      const result = new Function(code)();
      if (currentExecId !== id) return;
      const output = logs.join("\n");
      const resultStr = result !== undefined ? String(result) : "";
      self.postMessage({ id, type: "result", output, result: resultStr });
    } catch (err: any) {
      if (currentExecId !== id) return;
      self.postMessage({ id, type: "error", error: err.message });
    } finally {
      console.log = originalLog;
    }
  } else if (lang === "python" || lang === "py") {
    try {
      const pyodide = await getPyodide();
      if (currentExecId !== id) return;

      const pip = isPipCommand(code);
      if (pip.isPip) {
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
          try {
            await micropip.install(name);
          } catch {
            if (currentExecId !== id) return;
            self.postMessage({
              id, type: "error",
              error: `Module '${name}' could not be installed. It may require native OS libraries or not have a Pyodide-compatible wheel.\nTry: pip install ${name}`,
            });
            return;
          }
        }
      }

      const isRepl = data.type === "repl_exec";
      let globalsDict = isRepl ? replGlobals : pyodide.toPy({});

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
