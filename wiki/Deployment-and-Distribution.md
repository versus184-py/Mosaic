# Deployment and Distribution

This page documents how Mosaic is built, packaged, and distributed across platforms, including the CI/CD pipeline and release workflow.

---

## Release Workflow

Mosaic uses **GitHub Actions** for automated builds and releases. The workflow is triggered by pushing a tag matching `v*`.

```
Developer pushes tag v0.3.0
       │
       ▼
GitHub Actions: release.yml
       │
       ├── Matrix build (fail-fast: false):
       │   ├── windows-latest
       │   ├── macos-latest
       │   └── ubuntu-latest
       │
       ├── Each platform:
       │   ├── Checkout code
       │   ├── Setup Node.js 20
       │   ├── Setup Rust toolchain
       │   ├── Install Linux deps (if ubuntu)
       │   ├── npm ci
       │   └── npm run tauri:build
       │
       └── GitHub Release (softprops/action-gh-release@v2):
           ├── Windows: Mosaic_0.3.0_x64.msi + .exe (NSIS)
           ├── macOS: Mosaic_0.3.0_x64.dmg
           └── Linux: Mosaic_0.3.0_x86_64.AppImage
```

### Release Workflow File (`.github/workflows/release.yml`)

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        platform: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install Rust
        uses: actions-rust-lang/setup-rust-toolchain@v1
      
      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev libappindicator3-dev \
            librsvg2-dev patchelf
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run tauri:build
      
      - name: Upload artifacts
        uses: softprops/action-gh-release@v2
        with:
          files: |
            src-tauri/target/release/bundle/**/*
```

---

## Build Output

| Platform | Bundle Format | Output Path |
|----------|--------------|-------------|
| Windows | `.msi` (Windows Installer) + `.exe` (NSIS) | `src-tauri/target/release/bundle/msi/` + `nsis/` |
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
| Unit tests | `vitest run` | Runs 191 tests across 11 test files |
| Production build | `npm run build` | Verifies the app builds successfully |

The full test suite covers API config, provider routing, all stores (canvas, rag, ui), utility functions (validation, layout), components (SettingsDrawer, TopBar), and hooks (useDocumentParser).

---

## Tauri Configuration

The build configuration is in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Mosaic",
  "version": "0.3.0",
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
| Minor | `0.2.0` → `0.3.0` | New features, non-breaking |
| Patch | `0.3.0` → `0.3.1` | Bug fixes, non-breaking |

Current version: `0.3.0` (beta — API may change)

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
- **Asset hashing**: Cache-busting filenames (e.g., `main.a1b2c3d4.js`)

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          flow: ['@xyflow/react'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
});
```

### Release Checklist

Before publishing a new release:

- [ ] Version bumped in `package.json` and `tauri.conf.json`
- [ ] CHANGELOG updated with new version's changes
- [ ] CI passes on `main` (TypeScript check, tests, build)
- [ ] Test on all target platforms (Windows, macOS, Linux)
- [ ] Git tag created (`v0.x.x`)
- [ ] Release workflow triggered
- [ ] Release artifacts verified (download and install)
- [ ] Release notes written with highlights and upgrade instructions

### Manual Build and Deployment Steps

For maintainers who need to build and release manually:

```bash
# 1. Update version
# Edit package.json and tauri.conf.json with new version

# 2. Commit and tag
git add package.json src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.x.x"
git tag v0.x.x
git push origin main --tags

# 3. GitHub Actions will automatically run release.yml
# Monitor progress at: https://github.com/versus184-py/Mosaic/actions

# 4. After successful build, verify artifacts
# Download from the Release page and test on each platform

# 5. Write release notes
# Include: highlights, breaking changes, upgrade instructions, contributors
```

### Environment Variables for Build

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `TAURI_SIGNING_PRIVATE_KEY` | Code signing private key path | For signed builds | `./certs/key.pem` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Code signing key password | For signed builds | (password) |
| `APPLE_DEVELOPER_ID` | macOS signing identity | For macOS builds | `Developer ID Application: ...` |
| `APPLE_NOTARIZATION_USERNAME` | Apple ID for notarization | For macOS builds | `user@example.com` |
| `APPLE_NOTARIZATION_PASSWORD` | App-specific password for notarization | For macOS builds | (app-specific password) |
| `GITHUB_TOKEN` | GitHub API token (auto-set by Actions) | For GitHub releases | (auto-set in CI) |

### Rollback Procedure

If a release contains a critical bug:

1. **Tag the previous working version**:
   ```bash
   git tag v0.x.x-stable
   git push origin v0.x.x-stable
   ```
2. **Patch the bug** and create a new release (`v0.x.x+1`)
3. **Update the release notes** to warn users about the affected version
4. **Mark the affected release** as "Pre-release" on GitHub

---

## Next Steps

- [[Contributing Guide]] — How to contribute to development
- [[Security Model]] — Security in the build pipeline
- [[Changelog and Roadmap]] — Release history and planned features
