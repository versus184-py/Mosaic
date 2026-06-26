# Project Governance and Community

---

## License

Mosaic is released under the **MIT License**. This is a permissive open-source license that allows you to use, modify, distribute, and sublicense the software with minimal restrictions.

### Key Points

| Aspect | Detail |
|--------|--------|
| **License** | MIT |
| **Copyright** | Copyright (c) 2025 versus184-py |
| **Commercial use** | ✅ Allowed |
| **Modification** | ✅ Allowed |
| **Distribution** | ✅ Allowed |
| **Sublicensing** | ✅ Allowed |
| **Liability** | ❌ No liability |
| **Warranty** | ❌ No warranty |

### Full License Text

```
MIT License

Copyright (c) 2025 versus184-py

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Third-Party Licenses

Mosaic uses several open-source libraries. Below are their licenses:

| Library | License | Usage |
|---------|---------|-------|
| React 19 | MIT | UI framework |
| Tauri v2 | MIT / Apache 2.0 | Desktop shell |
| React Flow (@xyflow/react) | MIT | Canvas/graph |
| Framer Motion | MIT | Animations |
| Tailwind CSS | MIT | Styling |
| Zustand | MIT | State management |
| Pyodide | MPL-2.0 | Python in browser |
| Vite | MIT | Bundler |
| react-markdown | MIT | Markdown rendering |
| remark-gfm | MIT | GitHub Flavored Markdown |

Each library is used in accordance with its license terms. The combined work is distributed under the MIT License.

---

## Project Maintainers

Mosaic is currently maintained by:

- **versus184-py** — Creator and primary maintainer

### Maintainer Responsibilities

- Reviewing and merging pull requests
- Managing issues and feature requests
- Planning releases and roadmap
- Ensuring code quality and project direction
- Community moderation

### Becoming a Maintainer

Active contributors who demonstrate:
- Consistent, high-quality contributions
- Deep understanding of the codebase
- Helpful and constructive community participation
- Reliability and responsiveness

May be invited to become a maintainer. Express interest by contacting the current maintainer via GitHub.

---

## Community Guidelines

### Communication Channels

| Channel | Purpose | Link |
|---------|---------|------|
| GitHub Issues | Bug reports, feature requests, questions | [Issues](https://github.com/versus184-py/Mosaic/issues) |
| GitHub Discussions | General discussion, ideas, help | [Discussions](https://github.com/versus184-py/Mosaic/discussions) |
| Pull Requests | Code contributions | [PRs](https://github.com/versus184-py/Mosaic/pulls) |

### Expected Behavior

- **Be respectful**: Disagreement is fine, personal attacks are not
- **Be constructive**: Criticism should be specific and actionable
- **Be patient**: Maintainers and contributors have other commitments
- **Be helpful**: Answer questions when you can
- **Be inclusive**: Welcome newcomers and diverse perspectives

### Unacceptable Behavior

- Harassment, intimidation, or discrimination
- Trolling, insulting, or derogatory comments
- Spam or off-topic content
- Publishing others' private information
- Any other conduct that would be inappropriate in a professional setting

---

## How to Get Help

### Before Asking

1. **Search the wiki**: Many questions are answered here
2. **Search GitHub Issues**: Check if someone else had the same problem
3. **Search GitHub Discussions**: Community discussions may have solutions

### Asking Questions

If you can't find an answer:

1. Open a **GitHub Discussion** for general questions
2. Open a **GitHub Issue** for bug reports or feature requests
3. Provide as much context as possible:
   - What you're trying to do
   - What you've tried
   - What happened (error messages, screenshots)
   - Your environment (OS, Mosaic version)

---

## Supporting Mosaic

### Ways to Support

| Method | How to Help |
|--------|-------------|
| **Star the repo** | ★ on GitHub — helps with visibility |
| **Report bugs** | Open detailed bug reports |
| **Suggest features** | Open feature requests with use cases |
| **Contribute code** | Submit pull requests |
| **Improve docs** | Fix typos, clarify instructions, add examples |
| **Share screenshots** | Help build the gallery |
| **Spread the word** | Tell others about Mosaic |

### Financial Support

There is currently no financial support mechanism (no donations, sponsorships, or paid features). If this changes, it will be announced in the repository.

---

## Versioning and Stability

Mosaic is currently in **beta** (v0.x.x). While we strive for stability, the API and data format may change between minor versions.

| Phase | Version | Stability |
|-------|---------|-----------|
| Beta | 0.1.x - 0.9.x | Breaking changes possible |
| Stable | 1.0.0+ | Backward compatible |

### Data Migration

Canvas data is stored in localStorage and may need migration between versions. Mosaic includes validation utilities that detect incompatible data and reset to defaults when necessary. Always export important canvases before updating.

---

## Frequently Asked Community Questions

**Q: How do I request a new feature?**
A: Open a GitHub issue with the `feature` label. Describe the problem you're trying to solve, not just your proposed solution. Include use cases and examples.

**Q: Can I use Mosaic for commercial purposes?**
A: Yes. The MIT license allows commercial use, modification, and distribution. You can use Mosaic for your business, build on top of it, or embed it in commercial products.

**Q: I found a security issue. What should I do?**
A: Open a GitHub issue with the `security` label. Do not publicly disclose the vulnerability until it has been addressed.

**Q: How long does it take for PRs to be reviewed?**
A: PRs are reviewed on a best-effort basis. Small, focused PRs with clear descriptions are reviewed fastest. If you haven't heard back in 2 weeks, feel free to ping the thread.

**Q: Can I become a maintainer?**
A: Maintainers are invited based on sustained, high-quality contributions. If you're interested, start by contributing regularly and engaging constructively in discussions.

**Q: Is there a roadmap I can follow?**
A: Yes — see the [[Changelog and Roadmap]] page for planned features and priorities.

---

## Project Vision

Mosaic was created with a specific vision: **AI conversations should be non-linear and deeply interactive.** The traditional chat interface — a linear string of alternating messages — is a poor fit for how humans actually think and explore ideas. We explore, backtrack, branch, compare, and synthesize. A spatial canvas is the natural medium for this kind of thinking.

### Core Design Principles

1. **Spatial first**: The canvas is the primary interface, not an afterthought. Every interaction is designed around spatial thinking.
2. **Security by design**: Code execution, data storage, and network access are sandboxed by default. The user should never have to worry that a conversation could compromise their system.
3. **Local first**: Your data belongs to you. All data is stored locally unless you explicitly connect to external services. No telemetry, no cloud dependency.
4. **Provider agnostic**: Mosaic should work with any AI provider. The provider system is designed to be extensible — adding a new provider requires implementing just two functions.
5. **Interactive by default**: Code blocks have run buttons, responses have confidence scores, suggestions appear automatically. The app is designed for active exploration, not passive consumption.

### What Makes Mosaic Different

| Aspect | Traditional Chat | Mosaic |
|--------|-----------------|--------|
| Conversation shape | Linear (line) | Tree/branching (spatial) |
| Code interaction | Read-only text | Run inline, see output |
| Document usage | Manual copy-paste | Automatic RAG context injection |
| Multi-model | One at a time | Parallel debate across models |
| Spatial organization | None | Drag, arrange, zoom, collapse |
| Statefulness | One session | Multiple canvases with tabs |
| Confidence | None | AI self-scores responses |
| Suggestions | Users think of them | AI generates tendrils |

## Acknowledgements

Mosaic was built with the support of these amazing open-source projects:

- **[Tauri](https://tauri.app/)** — For providing a lightweight, secure desktop shell that makes cross-platform development a joy
- **[React](https://react.dev/)** — For the component model and ecosystem that enables complex UIs to remain maintainable
- **[React Flow](https://xyflow.com/)** — For the powerful node-based canvas that made the spatial interface possible
- **[Mistral AI](https://mistral.ai/)** — For their excellent API and models that power the default AI experience
- **[Pyodide](https://pyodide.org/)** — For bringing Python to the browser, enabling inline code execution without a backend
- **[Zustand](https://github.com/pmndrs/zustand)** — For simple and powerful state management with minimal boilerplate
- **[Tailwind CSS](https://tailwindcss.com/)** — For rapid UI development and consistent styling
- **[Framer Motion](https://www.framer.com/motion/)** — For smooth, declarative animations that make the UI feel alive
- **[Vite](https://vitejs.dev/)** — For fast, modern frontend tooling
- **[Tauri CLI](https://tauri.app/)** — For the build tools and bundler

And all the contributors who have reported bugs, suggested features, and submitted code — thank you!

### Dependencies

Mosaic distributes these third-party libraries in its build:

| Library | License | Purpose |
|---------|---------|---------|
| React | MIT | UI framework |
| React DOM | MIT | DOM renderer |
| @xyflow/react | MIT | React Flow canvas |
| framer-motion | MIT | Animations |
| react-markdown | MIT | Markdown rendering |
| remark-gfm | MIT | GitHub Flavored Markdown |
| zustand | MIT | State management |
| Tauri | MIT/Apache 2.0 | Desktop shell |
| Pyodide | MPL-2.0 | Python WASM runtime |

Each library is used in compliance with its license terms.

---

## Next Steps

- [[Contributing Guide]] — Start contributing
- [[Changelog and Roadmap]] — See what's coming
- [[Installation Guide]] — Get started with Mosaic
