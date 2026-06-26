# Deployment and Distribution

This page documents how Mosaic is built, packaged, and distributed across platforms, including the CI/CD pipeline and release workflow.

---

## Release Workflow

Mosaic uses **GitHub Actions** for automated builds and releases. The workflow is triggered by pushing a tag matching `v*`.

```
Developer pushes tag v0.2.0
       │
       ▼
GitHub Actions: release.yml
       │
       ├── Matrix build:
       │   ├── Windows (ubuntu-latest + windows-latest)
       │   ├── macOS (macos-latest)
       │   └── Linux (ubuntu-latest)
       │
       ├── Each platform:
       │   ├── Checkout code
       │   ├── Setup Node.js 20
       │   ├── Setup Rust toolchain
       │   ├── npm ci
       │   ├── npm run tauri:build
       │   └── Upload artifact
       │
       └── GitHub Release:
           ├── Windows: Mosaic_0.2.0_x64.msi
           ├── macOS: Mosaic_0.2.0_x64.dmg
           └── Linux: Mosaic_0.2.0_x86_64.AppImage
```

### Release Workflow File (`.github/workflows/release.yml`)

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev libgtk-3-dev \
            libayatana-appindicator3-dev librsvg2-dev \
            libsoup-3.0-dev
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run tauri:build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: mosaic-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

---

## Build Output

| Platform | Bundle Format | Output Path |
|----------|--------------|-------------|
| Windows | `.msi` (Windows Installer) | `src-tauri/target/release/bundle/msi/` |
| macOS | `.dmg` (Disk Image) | `src-tauri/target/release/bundle/dmg/` |
| Linux | `.AppImage` (Portable) | `src-tauri/target/release/bundle/appimage/` |

### Windows Packaging

The Windows build produces an `.msi` installer via the **Tauri Windows Installer** (tauri-utils):
- Creates Start Menu shortcut
- Associates `.msc` files (if configured)
- Sets up uninstaller via Windows Programs and Features
- Code signing can be configured via environment variables (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`)

### macOS Packaging

The macOS build produces a `.dmg` disk image:
- App is bundled as a `.app` bundle
- DMG provides drag-and-drop installation
- Notarization can be configured for macOS Gatekeeper
- Code signing requires an Apple Developer account

### Linux Packaging

The Linux build produces an `.AppImage`:
- Portable — no installation needed
- Works on most Linux distributions
- Can be packaged as `.deb` or `.rpm` with additional Tauri configuration

---

## CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsc --noEmit         # TypeScript type checking
      - run: npx vitest run --coverage # Unit tests
      - run: npm run build             # Production build
```

### CI Steps

| Step | Command | Purpose |
|------|---------|---------|
| TypeScript check | `tsc --noEmit` | Verifies type safety without emitting files |
| Unit tests | `vitest run --coverage` | Runs test suite with coverage report |
| Production build | `npm run build` | Verifies the app builds successfully |

Note: Unit tests (vitest) are configured in the CI pipeline but no test files exist yet. Contributions adding tests are welcome!

---

## Tauri Configuration

The build configuration is in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Mosaic",
  "version": "0.2.0",
  "identifier": "com.mosaic.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "Mosaic",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "wix": {
        "language": "en-US"
      }
    },
    "macOS": {
      "minimumSystemVersion": "10.15"
    },
    "linux": {
      "deb": {
        "depends": []
      }
    }
  }
}
```

### Key Configuration Fields

| Field | Purpose | Notes |
|-------|---------|-------|
| `identifier` | App identifier (reverse domain) | Must be unique per app |
| `frontendDist` | Vite production build output | `../dist` from `src-tauri/` |
| `devUrl` | Vite dev server URL | Port 1420 |
| `beforeDevCommand` | Starts Vite dev server before Tauri | `npm run dev` |
| `beforeBuildCommand` | Builds frontend before Tauri build | `npm run build` |
| `windows[].width/height` | Default window size | 1280x800 |
| `windows[].minWidth/minHeight` | Minimum window size | 800x600 |

---

## Versioning

Mosaic follows **Semantic Versioning** (SemVer):

| Version | Example | When |
|---------|---------|------|
| Major | `1.0.0` | Breaking changes |
| Minor | `0.1.0` → `0.2.0` | New features, non-breaking |
| Patch | `0.1.0` → `0.1.1` | Bug fixes, non-breaking |

Current version: `0.2.0` (beta — API may change)

---

## Development Build

```bash
# Development mode with hot reload
npm run tauri:dev

# This runs:
# 1. Vite dev server (port 1420) with HMR
# 2. Tauri window connected to dev server
# 3. Rust compilation (cached, fast)
```

### Development Features

- **Hot Module Replacement (HMR)**: Frontend changes appear instantly
- **DevTools**: Right-click → Inspect Element in the webview
- **Source maps**: Full TypeScript debugging
- **Unminified code**: Better error messages

---

## Production Build

```bash
# Production build
npm run tauri:build

# This runs:
# 1. tsc --noEmit (TypeScript check)
# 2. vite build (frontend bundling)
# 3. cargo build (Rust compilation)
# 4. tauri bundle (package into installer)
```

### Production Optimizations

- **Code splitting**: `@xyflow/react` → `flow` chunk, `framer-motion` → `motion` chunk
- **Minification**: Vite's built-in Terser/Rollup minification
- **Tree shaking**: Unused code is removed
- **Asset hashing**: Cache-busting filenames

---

## Next Steps

- [[Contributing Guide]] — How to contribute to development
- [[Security Model]] — Security in the build pipeline
- [[Changelog and Roadmap]] — Release history and planned features
