# Contributing Guide

Thank you for your interest in contributing to Mosaic! This guide covers everything you need to know to get started — from setting up your development environment to submitting a pull request.

---

## Code of Conduct

This project is committed to providing a welcoming, inclusive experience for everyone. By participating, you agree to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

---

## How to Contribute

### 1. Report Bugs

Open an [issue](https://github.com/versus184-py/Mosaic/issues) with the `bug` label. Include:

- **Operating system and version** (e.g., Windows 11, macOS 14.3)
- **Mosaic version** (from package.json or the About screen)
- **Steps to reproduce** — be as specific as possible
- **Expected behavior** — what should happen
- **Actual behavior** — what actually happens
- **Screenshots** (if applicable)
- **Console logs** (press F12 → Console tab)

### 2. Suggest Features

Open an [issue](https://github.com/versus184-py/Mosaic/issues) with the `feature` label. Include:

- **Problem**: What problem does this feature solve?
- **Solution**: How would you like it to work?
- **Alternatives**: What other approaches have you considered?
- **Mockups**: Screenshots or wireframes (if applicable)

### 3. Submit Code Changes

See the [Pull Request Process](#pull-request-process) section below.

### 4. Improve Documentation

Documentation improvements — fixing typos, clarifying instructions, adding examples — are always welcome. This wiki is a great place to start.

### 5. Share Screenshots

Help fill the [gallery](https://github.com/versus184-py/Mosaic#gallery) by sharing screenshots of Mosaic in use. Drop them in a GitHub issue.

---

## Development Setup

### Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Rust | Latest stable | [rustup.rs](https://rustup.rs/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### Step-by-Step Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Mosaic.git
cd Mosaic

# 2. Add upstream remote
git remote add upstream https://github.com/versus184-py/Mosaic.git

# 3. Install dependencies
npm install

# 4. Start development mode
npm run tauri:dev
```

### Verify Your Setup

```bash
# TypeScript check (should pass with no errors)
npx tsc --noEmit

# Build (should complete without errors)
npm run build
```

---

## Coding Conventions

### TypeScript & React

- **TypeScript strict mode**: Enabled in `tsconfig.json`. Use strict types everywhere
- **Functional components**: All React components are functional (no class components except ErrorBoundary)
- **Named exports**: Use named exports for components and functions
- **No default exports**: Prefer named exports for better IDE support and tree shaking

### State Management

- **Zustand stores**: All state management uses Zustand v5
  - State and actions co-located in a single file
  - Strong typing for all state and actions
  - Persistence middleware for data that should survive restarts
- **No prop drilling**: Use stores or hooks for shared state
- **Local state**: Use `useState` for truly local component state

### React Flow

- Custom nodes extend `NodeProps`
- Custom edges extend `EdgeProps`
- Node data is typed via `NodeData` interface
- Edge data is typed via `EdgeData` interface

### CSS & Styling

- **Tailwind CSS**: Use utility classes for styling
- **Glass UI**: Create glass-themed components in `src/components/glass/`
- **Theme variables**: Use CSS custom properties from the theme system
- **No inline styles**: Except for dynamic values (positions, animations)

### File Organization

```
src/
  api/          # LLM provider integrations
  components/
    canvas/     # React Flow nodes and edges
    glass/      # Glass UI component library
    modals/     # Modal dialogs
    ui/         # All other UI components
  hooks/        # Custom React hooks
  liquid-glass/ # Physics engine
  store/        # Zustand stores
  styles/       # CSS (globals.css)
  types/        # TypeScript definitions
  utils/        # Utility functions
  workers/      # Web Workers
```

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `MessageNode`, `GlassCard` |
| Hooks | camelCase with `use` prefix | `useStreamMessage` |
| Stores | camelCase with `Store` suffix | `canvasStore`, `uiStore` |
| Files | camelCase | `codeRunner.ts`, `useStreamMessage.ts` |
| Types/Interfaces | PascalCase | `NodeData`, `CanvasStats` |
| Functions | camelCase | `sendMessage`, `getConversationPath` |

---

## Pull Request Process

### Step 1: Create a Branch

```bash
git checkout -b feature/my-feature-name
```

Branch naming:
- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — code refactoring
- `chore/` — build, CI, dependencies

### Step 2: Make Changes

- Write clean, type-safe TypeScript
- Follow existing code patterns
- Update documentation if needed
- Test your changes manually

### Step 3: Run Checks

```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build
```

### Step 4: Commit

```bash
git add .
git commit -m "feat: add my feature"
```

Commit message format (Conventional Commits):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `refactor:` | Code restructuring |
| `chore:` | Build/config changes |
| `style:` | Formatting (no logic change) |
| `test:` | Adding/updating tests |

### Step 5: Push and Open PR

```bash
git push origin feature/my-feature-name
```

Then open a pull request on GitHub against the `main` branch.

### Step 6: PR Review

- Maintainers will review your PR
- Address any feedback with additional commits
- Once approved, a maintainer will merge your PR

### PR Checklist

Before submitting, verify:

- [ ] TypeScript check passes (`tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No lint warnings in the console
- [ ] Code follows existing conventions
- [ ] Documentation is updated (if needed)
- [ ] Commits use conventional commit format
- [ ] Branch is based on latest `main`

---

## Testing

Mosaic uses **Vitest** for unit testing. Tests are run in CI but no tests are written yet — contributions adding tests are especially welcome!

### Test File Location

Tests should be placed alongside the code they test:

```
src/utils/__tests__/validation.test.ts
src/hooks/__tests__/useStreamMessage.test.ts
```

### Running Tests

```bash
# Run all tests
npx vitest run

# Run tests with watcher
npx vitest

# Run with coverage
npx vitest run --coverage
```

### What to Test

- Utility functions (validation, encryption, deep clone)
- Store actions (especially state transformations)
- Provider-related logic (streaming, error handling)
- React components (rendering, user interactions)

---

## Project Architecture

Understanding the architecture is essential for making meaningful contributions:

| Area | Key Files | Description |
|------|-----------|-------------|
| State | `src/store/*.ts` | 7 Zustand stores |
| Canvas | `src/components/canvas/*.tsx` | React Flow nodes/edges |
| API | `src/api/*.ts` | LLM provider integrations |
| Hooks | `src/hooks/*.ts` | Custom React hooks for features |
| Glass UI | `src/liquid-glass/*.ts` | Physics-based glass rendering |
| Code exec | `src/workers/codeWorker.ts` | Sandboxed code execution |
| Validation | `src/utils/validation.ts` | Data validation utilities |
| Themes | `src/styles/globals.css` | CSS custom properties for 5 themes |

See the [[Overall Architecture and Data Flow]] page for a complete walkthrough.

---

## Getting Help

- **GitHub Issues**: For bugs, features, and questions
- **Code/Documentation**: Read the source and wiki
- **Existing PRs**: See what others are working on

---

## Next Steps

- [[Changelog and Roadmap]] — What's been done and what's planned
- [[Project Governance and Community]] — Project maintainers and community guidelines
- [[Overall Architecture and Data Flow]] — Understand how the pieces fit together
