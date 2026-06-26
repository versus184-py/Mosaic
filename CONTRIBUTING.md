# Contributing to Mosaic

Thank you for considering a contribution. Whether you're fixing a bug, adding a feature, improving documentation, or sharing an idea — every bit helps.

## Quick links

- [Code of Conduct](./CODE_OF_CONDUCT.md) — be excellent to each other
- [Wiki — Contributing Guide](https://github.com/versus184-py/Mosaic/wiki/Contributing-Guide) — detailed development setup and workflow
- [Wiki — Architecture Overview](https://github.com/versus184-py/Mosaic/wiki/Overall-Architecture-and-Data-Flow)
- [Wiki — Changelog & Roadmap](https://github.com/versus184-py/Mosaic/wiki/Changelog-and-Roadmap)

## Ways to contribute

### Report bugs
Open a [bug report](https://github.com/versus184-py/Mosaic/issues/new?labels=bug&template=bug.yml). Include your OS, Mosaic version, and steps to reproduce.

### Suggest features
Open a [feature request](https://github.com/versus184-py/Mosaic/issues/new?labels=enhancement&template=feature.yml). Explain the problem you're solving — not just the solution you have in mind.

### Submit code
1. Fork the repo and create a branch from `main`
2. Run `npm install` to set up dependencies
3. Make your changes, add tests
4. Run `npm run build`, `npx tsc --noEmit`, and `npx vitest run`
5. Open a pull request against `main`

See the [Contributing Guide on the wiki](https://github.com/versus184-py/Mosaic/wiki/Contributing-Guide) for detailed setup instructions, project structure, and coding conventions.

### Improve the wiki
The wiki is a separate repo cloned from `https://github.com/versus184-py/Mosaic.wiki.git`. Edits can be made directly through GitHub's wiki UI or by cloning the wiki repo.

### Share screenshots
Help us fill the [gallery](https://github.com/versus184-py/Mosaic#gallery). Take a screenshot of your canvas, drop it in a [GitHub issue](https://github.com/versus184-py/Mosaic/issues), and we'll add it to the README.

## Style & standards

- TypeScript with strict mode — no `any` types
- Components use React 19 + Tailwind CSS
- State managed with Zustand stores
- Tests use Vitest with user-event for component interaction
- Commit messages follow conventional commit style: `type(scope): description`
