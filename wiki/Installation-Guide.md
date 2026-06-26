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

### macOS / Linux
Prebuilt installers for macOS and Linux are not yet available. Please build from source (see below). If you'd like binaries for your platform, open a [feature request](https://github.com/versus184-py/Mosaic/issues).

---

## Build from Source

Building from source gives you the latest code and is required for macOS and Linux.

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
- Hot module reloading for the frontend
- The Tauri webview window
- DevTools available (right-click → Inspect Element)

The app opens a window at 1280x800 by default.

### Step 5: Build for Production

```bash
npm run tauri:build
```

The build process:
1. Compiles TypeScript with `tsc`
2. Bundles the frontend with Vite
3. Compiles the Rust backend with Cargo
4. Packages everything into a platform-specific installer

Build output goes to `src-tauri/target/release/bundle/`:
- Windows: `src-tauri/target/release/bundle/msi/Mosaic_*.msi`
- macOS: `src-tauri/target/release/bundle/dmg/Mosaic_*.dmg`
- Linux: `src-tauri/target/release/bundle/appimage/Mosaic_*.AppImage`

### Troubleshooting Build Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| `rustc not found` | Rust not installed | Run `rustup-init` or install via your package manager |
| `Failed to run custom build command for 'tauri'` | Missing system dependencies | See Tauri docs for your OS |
| WebKit issues (Linux) | Missing WebKit2GTK | `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev` |
| `npm ERR!` during install | Network or version issues | Try `npm cache clean --force` then `npm install` again |
| Build is very slow | First build compiles all Rust crates | Subsequent builds are much faster (incremental compilation) |

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
