# Installation Guide

This guide covers everything you need to install and configure Mosaic, from downloading a prebuilt binary to building from source and setting up your API keys.

---

## Download a Prebuilt Installer

The easiest way to get started is to download the latest release for your platform from the [Releases page](https://github.com/versus184-py/Mosaic/releases).

### Windows
1. Go to the [Releases page](https://github.com/versus184-py/Mosaic/releases)
2. Download the latest `.msi` installer
3. Run the installer and follow the on-screen instructions
4. Launch Mosaic from the Start Menu or desktop shortcut

### macOS
1. Go to the [Releases page](https://github.com/versus184-py/Mosaic/releases)
2. Download the latest `.dmg` disk image
3. Open the DMG and drag Mosaic to your Applications folder
4. Launch Mosaic from Applications

### Linux
1. Go to the [Releases page](https://github.com/versus184-py/Mosaic/releases)
2. Download the latest `.AppImage` file
3. Make it executable: `chmod +x Mosaic*.AppImage`
4. Run it: `./Mosaic*.AppImage`

---

## Build from Source

Building from source gives you the latest code and is useful for development and testing.

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| [Node.js](https://nodejs.org/) | 18+ | Includes npm |
| [Rust toolchain](https://rustup.rs/) | Latest stable | Install via `rustup` |
| [Mistral AI API key](https://console.mistral.ai/) | — | Required for AI features (free tier available) |

### Step 1: Install the Rust Toolchain

If you don't already have Rust installed:

```bash
# Visit https://rustup.rs/ or run:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Windows users: download and run rustup-init.exe from https://rustup.rs/
```

After installation, verify it works:

```bash
rustc --version
cargo --version
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/versus184-py/Mosaic.git
cd Mosaic
```

### Step 3: Install JavaScript Dependencies

```bash
npm install
```

This installs all frontend dependencies (React, React Flow, Zustand, Framer Motion, Tailwind CSS, etc.) and the Tauri CLI.

### Step 4: Run in Development Mode

```bash
npm run tauri:dev
```

This launches the application in development mode with:
- Hot module reloading for the frontend (changes appear instantly)
- The Tauri webview window (1280x800 by default)
- DevTools available (right-click → Inspect Element, or F12)
- Source maps for debugging TypeScript directly
- Unminified code with descriptive variable names

**What happens when you run `npm run tauri:dev`:**

```
1. Vite starts a dev server on http://localhost:1420
2. Vite compiles TypeScript → JavaScript (esbuild, fast)
3. Vite processes Tailwind CSS → compiled CSS
4. Tauri CLI launches the native window
5. The webview loads http://localhost:1420
6. Vite injects HMR client into the page
7. Any file change triggers HMR (sub-second refresh)
```

### Step 5: Build for Production

```bash
npm run tauri:build
```

The build process:
1. **TypeScript check**: `tsc --noEmit` verifies type safety
2. **Frontend bundling**: Vite bundles with code splitting, tree shaking, minification
3. **Rust compilation**: Cargo builds the Tauri backend in release mode
4. **App bundling**: Tauri packages everything into platform-specific installers

Build output goes to `src-tauri/target/release/bundle/`:
- Windows: `src-tauri/target/release/bundle/msi/Mosaic_*.msi`
- macOS: `src-tauri/target/release/bundle/dmg/Mosaic_*.dmg`
- Linux: `src-tauri/target/release/bundle/appimage/Mosaic_*.AppImage`

**Build time expectations:**
- First build: 2-5 minutes (Rust compilation + npm install)
- Subsequent builds: 30-60 seconds (incremental Rust compilation + cached Vite)
- The Rust backend is small (2 source files), so recompilation is fast

### Troubleshooting Build Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| `rustc not found` | Rust not installed | Run `rustup-init` or install via your package manager |
| `Failed to run custom build command for 'tauri'` | Missing system dependencies | See Tauri docs for your OS |
| WebKit issues (Linux) | Missing WebKit2GTK | `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev` |
| `npm ERR!` during install | Network or version issues | Try `npm cache clean --force` then `npm install` again |
| Build is very slow | First build compiles all Rust crates | Subsequent builds are much faster (incremental compilation) |
| `MSI` build fails (Windows) | Missing WiX Toolset | Install [WiX Toolset v3](https://wixtoolset.org/) |
| `dmg` build fails (macOS) | Missing create-dmg | `brew install create-dmg` |
| Permission denied on AppImage (Linux) | AppImage not executable | `chmod +x Mosaic*.AppImage` |
| Blank white window | Dev/build mismatch | Check that Vite dev server is running (dev mode) or frontend was built (production) |

### Verifying the Build

After a successful build, verify the installation:

```bash
# Check that the binary exists and has the right permissions
ls -la src-tauri/target/release/bundle/

# Run directly (without installer)
# Windows:
./src-tauri/target/release/mosaic.exe
# macOS/Linux:
./src-tauri/target/release/mosaic

# Check the version
./src-tauri/target/release/mosaic --version  # if implemented
```

The app should launch and show the Mosaic welcome screen.

### Dev Mode vs Production Mode

| Aspect | Development (`npm run tauri:dev`) | Production (`npm run tauri:build`) |
|--------|----------------------------------|-------------------------------------|
| Performance | Slower (unminified code, HMR) | Optimized (minified, tree-shaken) |
| Debugging | DevTools, React DevTools, source maps | Limited |
| Hot reload | Yes (instant frontend updates) | No |
| Console | Full logging | Minimal |
| Rust | Debug compilation (faster build) | Release compilation (optimized binary) |

For daily use, always use the production build. Use development mode for contributing and debugging.

---

## Configuration

Once Mosaic is running, open the Settings drawer by clicking the gear icon (or `Ctrl+,`) in the top bar.

### Essential Settings

| Setting | Description | Required |
|---------|-------------|----------|
| **API Key** | Your Mistral AI API key | Yes (or another provider) |
| **System prompt** | Custom instructions for the AI | Optional |
| **Temperature** | 0.0 (precise/deterministic) to 2.0 (creative/random) | Optional (default: 0.7) |
| **Theme** | Void, Dusk, Sand, Snow, or Sunrise | Optional (default: auto-detected) |
| **Minimap** | Toggle the canvas minimap on/off | Optional (default: on) |

### Obtaining API Keys

Mosaic supports five LLM providers. You need at least one API key to use AI features.

#### Mistral AI (Primary)
1. Go to [console.mistral.ai](https://console.mistral.ai/)
2. Sign up for a free account (generous free credits included)
3. Navigate to **API Keys** and create a new key
4. Copy the key and paste it into Mosaic's Settings drawer
5. Available models: `mistral-large-latest`, `mistral-small-latest`

#### OpenAI
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Paste it into Mosaic's Settings drawer under OpenAI
5. Available models: `gpt-4o`, `gpt-4o-mini`

#### Anthropic
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Generate an API key
4. Paste it under Anthropic in Mosaic's Settings
5. Available models: `claude-sonnet-4-20250514`, `claude-haiku-3-5-20241022`

#### Gemini
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign up or log in
3. Create an API key
4. Paste it under Gemini in Mosaic's Settings
5. Available models: `gemini-2.5-pro-exp-03-25`, `gemini-2.0-flash-exp`

#### Ollama (Local)
1. Download and install [Ollama](https://ollama.com/)
2. Run `ollama serve` to start the local server
3. Pull a model: `ollama pull llama3.2` (or any model you prefer)
4. In Mosaic's Settings, configure the Ollama URL (default: `http://localhost:11434`)
5. Click **Detect** — Mosaic will list available models automatically
6. No API key needed for local models

---

## Next Steps

Now that Mosaic is installed and configured:

- [[Tutorial - Your First Conversation]] — Send your first message and explore the canvas
- [[LLM Provider Integration]] — Deep dive into provider configuration
- [[Canvas and Node System]] — Understand the spatial canvas and node types
- [[Keyboard Shortcuts and UI Reference]] — Learn the shortcuts for efficient use
