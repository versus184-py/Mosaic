# Tutorial: Running Code Inline

Mosaic lets you run **JavaScript** and **Python** code directly inside chat nodes. Code runs in a sandboxed environment — safe, isolated, and without network access (except for specific CDN hosts used by Pyodide).

**Estimated time**: 15 minutes

---

## How Code Execution Works

When an AI response contains a code block, Mosaic renders it with a **Run** button. You can also write your own code in the input. Code execution happens in:

- **JavaScript**: A sandboxed Web Worker with strict globals — no `fetch`, `XMLHttpRequest`, `WebSocket`, or DOM access
- **Python**: Pyodide (Python compiled to WebAssembly) running in the browser — sandboxed with allowlisted packages and blocked system APIs

---

## Step 1: Run JavaScript from an AI Response

1. Ask the AI a question that involves code:

```
Write a JavaScript function that checks if a string is a palindrome
```

2. The AI responds with a code block that includes a **Run** button
3. Click **Run** ▶️ to execute the code
4. The output appears below the code block

Example output:

```
✅ "racecar" is a palindrome: true
✅ "hello" is a palindrome: false
```

### What You'll See

Each code block shows:
- **Language badge** (e.g., `JavaScript` or `Python`)
- **Run button** — click to execute
- **Collapse/Expand** toggle for long code
- **Output pane** — shows stdout, results, or errors
- **Dismiss** button to clear output

---

## Step 2: Run Python from an AI Response

1. Ask for Python code:

```
Write a Python script using numpy to calculate the mean and median of a list
```

2. The AI responds with a Python code block
3. Click **Run** ▶️

> **Note**: The first Python execution may take a few seconds while Pyodide loads (it downloads the Python WASM runtime from the CDN). Subsequent runs are instant.

---

## Step 3: Write and Run Your Own Code

You can execute custom code from the input field:

1. Click any node and type code directly
2. The AI will interpret it as a question. To ensure code execution, you can prefix with instructions:

```
Run this JavaScript:
console.log("Hello from Mosaic!");
console.log("2 + 2 =", 2 + 2);
```

3. Or for Python:

```
Run this Python:
import numpy as np
print(np.array([1,2,3,4,5]).mean())
```

The AI will reformat the code into a proper code block with a Run button.

> **Tip**: You don't actually need the AI to reformat. Just include the code block with the language specified: ```` ```python ````

---

## Step 4: Use the Python REPL Terminal

Mosaic includes a persistent **Python REPL** terminal for interactive coding:

1. Click the **terminal icon** in the top bar (or use the floating terminal widget)
2. A terminal window opens (520x320 pixels, draggable)
3. Type Python commands directly:

```python
>>> import numpy as np
>>> np.random.randn(5)
array([ 0.42, -1.23,  0.87,  2.01, -0.55])
```

### REPL Features

| Feature | How |
|---------|-----|
| **Persistent state** | Variables persist between commands |
| **Command history** | Press ArrowUp/ArrowDown to cycle through history |
| **Clear screen** | Type `clear()` or `!clear` |
| **Reset state** | Type `reset()` or `!reset` |
| **Multi-line** | Python handles multi-line input (functions, loops) |

### REPL Special Commands

| Command | Action |
|---------|--------|
| `reset()` / `!reset` | Reset Python environment (clear all variables) |
| `clear()` / `!clear` | Clear terminal display |

---

## Step 5: Understanding Sandbox Limits

### JavaScript Restrictions

The JavaScript sandbox blocks the following APIs for security:

```javascript
// These will throw errors:
fetch('https://example.com');
new XMLHttpRequest();
new WebSocket('ws://example.com');
new Worker('worker.js');
localStorage.setItem('key', 'value');
open('https://example.com');
import('some-module');
```

**Allowlisted globals** include: `Math`, `Date`, `JSON`, `Array`, `Object`, `String`, `Number`, `Boolean`, `Map`, `Set`, `Promise`, `RegExp`, `Error`, `console`, `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `parseInt`, `parseFloat`, `isNaN`, `isFinite`, `decodeURI`, `encodeURI`, `decodeURIComponent`, `encodeURIComponent`, `ArrayBuffer`, `Uint8Array`, `Int8Array`, `Uint16Array`, `Int16Array`, `Uint32Array`, `Int32Array`, `Float32Array`, `Float64Array`, `BigInt`, `Symbol`, `Reflect`, `Proxy`, `Math`, `Date`, `structuredClone`, `WeakMap`, `WeakSet`.

### Python Restrictions

| Restriction | Detail |
|-------------|--------|
| **Allowlisted packages** | `numpy`, `scipy`, `pandas`, `matplotlib`, `sympy`, `requests`, `beautifulsoup4`, `lxml`, `Pillow`, `markdown`, `jinja2`, `pyyaml`, `toml`, `colorama`, `tqdm` |
| **Network fetch** | Only allowed to: `cdn.jsdelivr.net`, `pyodide-cdn2.iodide.io`, `files.pythonhosted.org` |
| **System modules blocked** | `msvcrt`, `termios`, `fcntl`, and other platform-specific C extensions |
| **Execution timeout** | 30 seconds per execution |

### Why These Restrictions?

The sandbox ensures that:
1. **AI-generated code cannot harm your system** — no file system access, no network requests
2. **Malicious code cannot exfiltrate data** — API keys and local data are inaccessible
3. **Code cannot make unauthorized API calls** — only the Mistral API and Pyodide CDNs are reachable

---

## Step 6: Confirm Before Running AI-Generated Code

For safety, the first time you run AI-generated code in a session, Mosaic shows a confirmation dialog:

```
⚠️ This code was generated by AI. Are you sure you want to run it?
[Cancel] [Run Anyway]
```

This only appears once per session for AI-generated code blocks. Code you write yourself does not trigger this warning.

---

## Common Code Execution Scenarios

### Data Analysis with Python

```python
import pandas as pd
import numpy as np

data = {'name': ['Alice', 'Bob', 'Charlie'],
        'score': [85, 92, 78]}
df = pd.DataFrame(data)
print(df.describe())
print(f"Mean score: {df['score'].mean()}")
```

### Visualization with matplotlib

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
```

> **Note**: matplotlib plots render inline in the output pane.

### Algorithm Practice in JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

for (let i = 0; i < 10; i++) {
  console.log(`fib(${i}) = ${fibonacci(i)}`);
}
```

---

## What Happens When You Click Run

Understanding the execution pipeline helps debug issues and set expectations:

```
1. User clicks "Run" on code block
2. CodeBlock component extracts language and code text
3. codeRunner.runCode(lang, code) called
4.   → Creates Web Worker if not already running
5.   → Generates unique execution ID (UUID)
6.   → Sets 30-second timeout
7.   → Posts message to Worker: { exec_id, lang, code }
8. Worker receives message:
9.   → JavaScript: new Function(...sandboxGlobals)(...globals)
10.  → Python: pyodide.runPython(code) with output capture
11. Worker sends messages back:
12.  → stdout: captured console.log/print output
13.  → result: return value
14.  → error: error message + stack trace
15. codeRunner collects output messages
16. Promise resolves with CodeResult: { output, error?, executionTime? }
17. CodeBlock component displays output/error in the output pane
```

**Total round trip**: For simple JavaScript, typically 5-50ms. For Python (first run): 2-5 seconds (Pyodide loading). For Python (subsequent runs): 50-500ms.

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Pyodide failed to load" | Network issue or CDN unavailable | Check your internet connection; Pyodide is loaded from `cdn.jsdelivr.net` |
| "Execution timed out" | Code took longer than 30 seconds | Optimize your code or break it into smaller pieces |
| "fetch is not defined" | JavaScript sandbox blocks fetch | Use Python with `requests` instead (allowlisted) |
| "Module 'xyz' not found" | Package not in allowlist | Use an allowlisted package or implement without the dependency |
| Python execution hangs | Large computation in WASM | WASM Python is slower than native; consider smaller datasets |
| Output is empty | Code didn't produce output | Add `console.log()` or `print()` statements |
| "ReferenceError: X is not defined" | X is not in the allowlist | Use only allowlisted globals or restructure code |

---

## Next Steps

- [[Canvas and Node System]] — Understand the full node system
- [[Tutorial - Advanced Features in Practice]] — Combine code execution with other features
- [[Code Sandbox Architecture]] — Deep dive into security and isolation
