# Troubleshooting and FAQ

This page covers common issues, error messages, and frequently asked questions about Mosaic.

---

## Troubleshooting

### Installation Issues

#### "Rust toolchain not found" during build

**Error**:
```
Error: failed to run custom build command for 'tauri'
```

**Cause**: Rust is not installed or not in PATH.

**Solution**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Windows: download rustup-init.exe from https://rustup.rs/

# Verify installation
rustc --version
cargo --version
```

#### "WebKit2GTK not found" on Linux

**Error**:
```
Failed to run custom build command for 'webkit2gtk'
```

**Cause**: Missing Linux system dependencies.

**Solution**:
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel gtk3-devel \
  libappindicator-gtk3-devel librsvg2-devel libsoup3-devel

# Arch
sudo pacman -S webkit2gtk-4.1 gtk3 libappindicator-gtk3 librsvg libsoup3
```

#### "npm ERR!" during install

**Cause**: Network issues, npm cache corruption, or version mismatch.

**Solution**:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

### API Key Issues

#### "Invalid API key" error

**Cause**: The API key is incorrect, expired, or belongs to a different provider.

**Solutions**:
- Verify the key in your provider's console
- Ensure you selected the correct provider in Settings
- Check that the key has the correct permissions (some providers require enabling API access)
- Regenerate the key and update it in Settings

#### "Cannot connect to Ollama"

**Causes**:
- Ollama is not installed or not running
- Ollama URL is incorrect in Settings
- Ollama is running on a different port

**Solutions**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# If running on a different host/port, update URL in Settings
# Default: http://localhost:11434
```

#### API key not persisting across restarts

**Cause**: localStorage data may have been cleared or corrupted.

**Solution**:
- Re-enter the API key in Settings
- Check that your browser isn't set to clear localStorage on exit
- If using a privacy-focused browser, add an exception for Mosaic
- Note: each provider has its own key field — ensure you've entered the key under the correct provider section

#### "No API key configured for this provider"

**Cause**: You've selected a model from a provider that has no API key configured.

**Solution**:
- Open Settings and enter the API key for the provider you're using
- If using Ollama, no key is needed — ensure Ollama is running and connected
- Mistral is the default provider — if no keys are configured, configure at least Mistral or switch to Ollama

---

### Streaming Issues

#### AI response stops mid-stream

**Causes**:
- Network interruption
- Provider API timeout
- AbortController triggered (user pressed stop)

**Solutions**:
- Click the **retry** button on the response node
- Check your internet connection
- The partial response is preserved in the node

#### Streaming is slow

**Causes**:
- Large conversation history (many tokens sent as context)
- Provider-side latency
- Slow internet connection

**Solutions**:
- Start a new canvas for unrelated topics (reduces context size)
- Switch to a faster model (e.g., Mistral Small instead of Large)
- Check provider status page for outages

#### "AbortError" in console

**Cause**: A streaming request was intentionally cancelled (user pressed stop or navigated away). This is **normal** and not an error.

---

### Code Execution Issues

#### "Pyodide failed to load"

**Error**:
```
Pyodide failed to load. Check your internet connection.
```

**Causes**:
- Internet connection is down
- CDN (cdn.jsdelivr.net) is blocked or unreachable
- CSP policy is blocking the CDN

**Solutions**:
- Check your internet connection
- If behind a corporate firewall, ensure `cdn.jsdelivr.net` is allowlisted
- Check that CSP in `tauri.conf.json` includes `https://cdn.jsdelivr.net`

#### "Execution timed out"

**Cause**: Code took longer than 30 seconds to execute.

**Solutions**:
- Optimize the code to run faster
- Break large computations into smaller pieces
- For very large computations, consider running them outside Mosaic

#### "Module 'xyz' not found"

**Cause**: The Python package is not in the allowlist.

**Solution**: Use one of the allowlisted packages only:
```
numpy, pandas, scipy, matplotlib, sympy, requests,
beautifulsoup4, lxml, Pillow, markdown, jinja2, pyyaml, toml, colorama, tqdm
```

#### "fetch is not defined" in JavaScript

**Cause**: The JavaScript sandbox blocks network APIs.

**Solutions**:
- Use Python with `requests` if you need network access (still restricted to CDN hosts)
- Pre-compute data outside Mosaic and paste results in
- Use local data with array operations

#### Python execution is very slow

**Cause**: Pyodide runs CPython in WebAssembly, which is slower than native Python.

**Solutions**:
- Use smaller datasets
- Avoid heavy loops; use numpy vectorized operations instead
- For computationally intensive tasks, run outside Mosaic

---

### Canvas Issues

#### Canvas feels laggy with many nodes

**Cause**: React Flow performance degrades with hundreds of nodes.

**Solutions**:
- Collapse branches you're not actively working with
- Delete unnecessary nodes
- Start a new canvas for unrelated topics
- Ensure you're not running on battery saver mode (reduced rendering)

#### "Failed to import canvas"

**Cause**: The imported JSON file is corrupted or has an invalid structure.

**Solutions**:
- Ensure the file is valid JSON
- The file must contain `nodes` and `edges` arrays
- Each node needs `id`, `type`, `position`, and `data` fields
- Check that the file was exported from Mosaic (not modified externally)

#### Nodes overlap after zoom

**Cause**: Auto-layout not triggered after manual node rearrangement.

**Solution**: Press `F` to fit all nodes, or use **Auto-arrange** in Settings or context menu.

#### Undo not working for text edits

**Cause**: Undo history only captures **position changes**, not text edits.

**Workaround**: Undo is designed for spatial operations (node positions). Text edits are immediately saved.

---

### RAG Issues

#### "The AI doesn't know about my document"

**Causes**:
- RAG is not enabled (toggle in DocumentPanel)
- Query doesn't match document content
- Document was uploaded but not properly chunked
- Embedding API failed and TF-IDF search is less accurate

**Solutions**:
- Verify RAG is toggled ON in DocumentPanel
- Try using keywords from the document in your query
- Re-upload the document
- Check browser console for embedding API errors

#### "File too large" error

**Cause**: File exceeds the 10 MB per-file limit or total storage exceeds 50 MB.

**Solutions**:
- Split large files into smaller ones
- Remove unused documents
- Reduce document count (max 50)

---

### UI Issues

#### Theme not applying

**Cause**: Browser or OS-level reduced-transparency setting is active.

**Solution**: Mosaic respects `prefers-reduced-transparency`. If enabled, glass effects are reduced. Disable this OS setting for full glass effects.

#### Keyboard shortcuts not working

**Causes**:
- Input field is focused (some shortcuts are disabled while typing)
- Another application is intercepting the shortcut
- Tauri window doesn't have focus

**Solutions**:
- Click on empty canvas space to ensure the canvas has focus
- Check that Mosaic window is active
- Some shortcuts (like Ctrl+N for new chat) may conflict with browser shortcuts if running in dev mode

---

## FAQ

### General

**Q: Is Mosaic free?**

A: Mosaic is open source (MIT license) and free to use. You only pay for API usage from your chosen LLM providers (Mistral, OpenAI, Anthropic, Gemini). Ollama (local models) is completely free.

**Q: Can I use Mosaic offline?**

A: Partially. You can browse existing canvases and use Ollama-connected local models offline. Cloud providers (Mistral, OpenAI, Anthropic, Gemini) require internet. Code execution (JavaScript/Python) works offline after Pyodide is loaded.

**Q: Is my data sent to external servers?**

A: Only your messages and API keys are sent to the LLM provider you select. Documents uploaded for RAG are stored locally and never leave your machine. Mosaic has no telemetry or analytics that send data externally.

**Q: How are API keys stored?**

A: Each provider's API key is stored separately under `mosaic-api-key-{provider}` in localStorage (e.g., `mosaic-api-key-mistral`, `mosaic-api-key-openai`). Keys are XOR-encrypted before storage and decrypted in memory for use. This is not production-grade encryption (see [[Security Model]] for details).

**Q: What happens to my uploaded documents?**

A: Documents are stored in localStorage as text chunks. They are never sent to external servers except when Mosaic queries the embedding API (which sends the chunk text for vectorization). You can delete documents at any time.

**Q: How do I report a bug?**

A: Open a [GitHub issue](https://github.com/versus184-py/Mosaic/issues) with a clear description, steps to reproduce, and relevant screenshots.

### Technical

**Q: Can I use custom LLM endpoints?**

A: Not directly. Mosaic supports Mistral, OpenAI, Anthropic, Gemini (cloud), and Ollama (local). For custom endpoints, consider using Ollama as a proxy with a custom model, or open a feature request for custom provider support.

**Q: How are tokens counted for cost estimation?**

A: Mosaic uses a simple heuristic: `Math.ceil(text.length / 4)`. This estimates ~4 characters per token, which is a reasonable approximation for English text. Actual token counts may vary by provider and language. The estimation is used only for analytics display; providers charge based on their own tokenization.

**Q: Can I delete the localStorage data to reset Mosaic?**

A: Yes. To completely reset Mosaic:
1. Close the app
2. Open your browser's DevTools storage inspector (or use a localStorage manager extension)
3. Delete all keys starting with `mosaic-`: `mosaic-canvases`, `mosaic-canvas-data-*`, `mosaic-ui`, `mosaic-analytics`, `mosaic-rag`
4. Alternatively, use the Settings drawer's "Clear Canvas" button (clears only the current canvas)
5. Reopen Mosaic — it will initialize fresh

**Q: Does Mosaic work with corporate proxies/VPNs?**

A: It depends:
- **Ollama (local)**: Works fine, no internet needed
- **Cloud providers**: Must be able to reach the provider's API endpoint. Corporate proxies that block unknown HTTPS endpoints may interfere. Configure your proxy to allowlist:
  - `api.mistral.ai`
  - `api.openai.com`
  - `api.anthropic.com`
  - `generativelanguage.googleapis.com`
  - `cdn.jsdelivr.net` (for Pyodide)
  - `files.pythonhosted.org` (for pip packages)
  - `pyodide-cdn2.iodide.io` (for Pyodide CDN)

**Q: Is there a maximum canvas size?**

A: The practical limit depends on your machine's memory. React Flow uses virtual rendering, so only visible nodes consume rendering resources. However:
- Each node's data is stored in memory and localStorage
- undo history stores up to 50 snapshots of the entire node/edge state
- RAG documents are stored as text chunks (limited to 50 MB total)
- Most users report good performance up to 200 nodes

**Q: Can I run Mosaic in a browser (not as a desktop app)?**

A: Mosaic is built with Tauri, which requires a native shell. However, you can run the frontend in a browser for development:
```bash
npm run dev
# opens http://localhost:1420 in your browser
```
Note: Some features (CSP enforcement, window management) won't work in browser mode. API calls will still work, but localStorage persistence and desktop-specific features won't be available.

---

**Q: What browsers/engines are supported?**

A: Mosaic uses the Tauri webview, which on Windows is WebView2 (Edge Chromium), on macOS is WKWebView (Safari), and on Linux is WebKitGTK. All modern rendering engines are supported.

**Q: Can I run code on my GPU?**

A: No. Code executes in a Web Worker (CPU only). Python runs in WebAssembly, which doesn't support GPU compute. For GPU workloads, run code outside Mosaic.

**Q: How many nodes can a canvas handle?**

A: Performance depends on your machine. Most users report smooth performance with 50-100 nodes. Beyond 200 nodes, you may notice reduced responsiveness. The app handles this gracefully with React Flow's virtual rendering.

**Q: Is there a mobile version?**

A: Not currently. Mosaic is a desktop application built with Tauri. A mobile version is not on the roadmap, but the web version can be accessed in a mobile browser (limited functionality).

**Q: Can I collaborate with others on a canvas?**

A: Not yet. Collaborative canvases are on the roadmap (see [[Changelog and Roadmap]]).

---

---

## Diagnostic Tools

### Accessing Developer Tools

While running in development mode (`npm run tauri:dev`), you can access the browser DevTools:

- **Windows/Linux**: Right-click → Inspect Element, or press F12
- **macOS**: Right-click → Inspect Element, or press Cmd+Option+I

In the DevTools console, you can:

```javascript
// Check store state
console.log(window.__ZUSTAND_STORES__);  // If exposed

// Manually trigger save
localStorage.getItem('mosaic-canvases');

// Check RAG data
localStorage.getItem('mosaic-rag');

// Check analytics
localStorage.getItem('mosaic-analytics');

// Inspect all localStorage keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('mosaic-')) {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  }
}
```

### Checking Network Requests

In the DevTools **Network** tab, you can monitor:
- API calls to LLM providers (verify streaming is working)
- CDN requests for Pyodide (verify loading)
- Any blocked requests (CSP violations)

### Log File Locations

Mosaic does not write log files to disk. All logging goes to:
- **Browser console** (while running in dev mode)
- **Tauri logs** (if Tauri processes emit errors)

For production builds, run from the command line to see stdout:

```bash
# Windows (from the MSI install location)
"C:\Program Files\Mosaic\Mosaic.exe" 2>&1

# Or if built from source
npm run tauri:dev
```

---

## Still Having Issues?

1. **Search existing issues**: Check [GitHub Issues](https://github.com/versus184-py/Mosaic/issues) for similar problems
2. **Open a new issue**: If you can't find a solution, create a new issue with:
   - Your operating system and Mosaic version
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Any error messages from the console (F12 → Console tab)
   - A minimized reproduction case if possible
3. **Feature requests**: Use the same [GitHub Issues](https://github.com/versus184-py/Mosaic/issues) page with the `feature` label

---

## Next Steps

- [[Security Model]] — Understand Mosaic's security architecture
- [[Deployment and Distribution]] — Build and release process
- [[Contributing Guide]] — How to help fix issues
