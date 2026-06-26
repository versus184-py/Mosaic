# Tutorial: Customizing Mosaic

This tutorial shows you how to tailor Mosaic to your specific needs — from writing effective system prompts and tuning temperature to choosing themes and optimizing your provider setup.

**Estimated time**: 15 minutes

---

## Step 1: Write an Effective System Prompt

The **system prompt** sets the AI's behavior, tone, and constraints. It's the single most powerful customization.

### Accessing the System Prompt

1. Open Settings (⚙️)
2. Find the **System Prompt** textarea

### Example System Prompts

**For technical documentation**:
```
You are a senior technical writer. Write clear, concise documentation
with code examples. Use active voice. Include a "Prerequisites" section
for any setup steps. Always explain WHY before HOW.
```

**For creative brainstorming**:
```
You are a creative brainstorming partner. Generate diverse, unconventional
ideas. Don't self-censor. Structure responses as: (1) The core idea,
(2) Why it might work, (3) Potential challenges, (4) How to get started.
```

**For code review**:
```
You are a senior software engineer conducting a code review. Analyze code for:
- Correctness: does it work?
- Performance: can it be optimized?
- Maintainability: is it readable and well-structured?
- Security: are there vulnerabilities?
Be constructive and specific in your feedback.
```

### Tips for Good System Prompts

| Do | Don't |
|----|-------|
| Be specific about tone and format | Use vague instructions like "be helpful" |
| Include constraints (length, format) | Assume the AI knows your context |
| Set clear role expectations | Overwhelm with contradictory instructions |
| Keep it under 500 characters | Write a novel — concise prompts work better |

---

## Step 2: Tune Temperature

**Temperature** controls randomness in the AI's responses:

| Value | Range | Effect | Best For |
|-------|-------|--------|----------|
| 0.0 - 0.2 | Low | Deterministic, focused, repetitive | Code generation, factual Q&A, data extraction |
| 0.3 - 0.7 | Medium | Balanced creativity and precision | General conversation, analysis, explanations |
| 0.8 - 1.2 | High | Creative, diverse, unpredictable | Brainstorming, creative writing, ideation |
| 1.3 - 2.0 | Very High | Highly random, may be incoherent | Experimental, poetry, surreal content |

### Setting Temperature

1. Open Settings (⚙️)
2. Adjust the **Temperature** slider (0.0 to 2.0)

### Practical Tips

- **Code generation**: Use 0.1-0.2 for deterministic, correct code
- **Debugging/analysis**: Use 0.3-0.5 for clear, logical analysis
- **Explanations**: Use 0.5-0.7 for natural, readable explanations
- **Brainstorming**: Use 0.8-1.0 for diverse ideas
- **Switch mid-conversation**: You can change temperature between branches for different perspectives on the same topic

---

## Step 3: Choose a Theme

Mosaic has 5 visual themes. The right theme reduces eye strain and improves focus.

### Theme Gallery

| Theme | Type | Background | Accent | Best For |
|-------|------|-----------|-------|----------|
| **Void** | Dark | Deep black/blue | Cool blue | Long coding sessions, low-light environments |
| **Dusk** | Dark | Cosmic purple | Rich purple | Creative work, evening use |
| **Sand** | Light | Warm beige | Earth tones | Daytime use, bright rooms |
| **Snow** | Light | Clean cool gray | Blue-gray | Professional settings, readability |
| **Sunrise** | Light | Golden warm | Gold tones | Morning use, warm environments |

### Switching Themes

1. Open Settings (⚙️)
2. Click a theme in the **Theme** grid
3. The theme applies immediately

### Theme Auto-Detection

On first launch, Mosaic auto-detects your OS theme preference (dark/light) and selects the appropriate theme. You can override this manually.

### Accessibility

Mosaic respects your OS accessibility settings:
- `prefers-reduced-motion`: Disables animations
- `prefers-reduced-transparency`: Reduces glass effects

---

## Step 4: Optimize Provider Configuration

### Provider Selection Strategy

| Goal | Recommended Provider | Model |
|------|--------------------|-------|
| Maximum quality | Anthropic | Claude Sonnet 4 |
| Best value | Mistral | Mistral Large |
| Speed/simplicity | Mistral | Mistral Small |
| Creative tasks | OpenAI | GPT-4o |
| Local/offline | Ollama | Any local model |
| Cost-sensitive | Ollama or Mistral Small | Local or Small |

### Multiple Provider Setup

Configure all providers for maximum flexibility:

1. **Mistral**: Primary — fast, reliable, good value
2. **OpenAI**: Secondary — good for creative tasks
3. **Anthropic**: For complex reasoning tasks
4. **Gemini**: Alternative for specific tasks
5. **Ollama**: Offline/local when internet is unavailable

### Debate Model Configuration

For parallel debate, choose models with complementary strengths:

| Combination | Best For |
|-------------|----------|
| Mistral Large + GPT-4o | General comparison |
| Claude Sonnet + Mistral Large | High-quality reasoning |
| Mistral Small + GPT-4o-mini | Cost-effective comparison |
| All 4 providers | Comprehensive analysis |

---

## Step 5: Configure Canvas Preferences

### Minimap

Toggle in Settings → Canvas → Minimap:
- **On** (default): Shows an overview of all nodes in the bottom-right corner
- **Off**: More canvas space, less visual distraction

### Confidence Scoring

Toggle in Settings → Canvas → Confidence:
- **On** (default): Each response shows a confidence badge
- **Off**: Cleaner node appearance, saves one API call per response

### Suggestion Tendrils

Toggle in Settings → Canvas → Tendrils:
- **On** (default): Auto-generated follow-up suggestions after each response
- **Off**: No suggestion nodes, less visual activity

---

## Step 6: Master Auto-Layout

Auto-layout arranges nodes in a radial tree pattern. Useful when:

- **The canvas is messy** after extensive branching
- You've **dragged nodes around** and want a clean arrangement
- After **importing** a canvas from another session

**Trigger auto-layout**:
1. Settings → **Auto-arrange** (arranges entire canvas)
2. Right-click a node → **Auto-arrange** (arranges from that node downward)

---

## Step 7: Export/Import for Portability

### Export Workflow

1. Complete your analysis
2. Settings → **Export**
3. File downloads as `mosaic-{canvas-name}.json`
4. Share with team members or archive

### Import Workflow

1. Settings → **Import**
2. Select a `.json` file
3. Canvas is validated and loaded
4. All nodes, edges, bookmarks, and analytics are restored

### Backup Strategy

- **Daily**: Export critical canvases at the end of each session
- **Before major changes**: Export before trying experimental features
- **Sharing**: Export a clean canvas without sensitive data

---

## Step 8: Customize with Ollama Local Models

For full control, run local models via Ollama:

1. Install [Ollama](https://ollama.com/)
2. Pull models: `ollama pull llama3.2` `ollama pull mistral`
3. Point Mosaic to `http://localhost:11434`
4. Click **Detect**

**Benefits of local models**:
- **No API costs** — runs entirely on your machine
- **Offline** — works without internet
- **Privacy** — data never leaves your computer
- **Custom models** — use any model Ollama supports

**Tradeoffs**:
- Slower than cloud APIs (especially on CPU)
- Lower quality for most local models vs. cloud
- Requires significant RAM/VRAM

---

## Step 9: Create Workflow Templates

Once you've configured Mosaic perfectly, save your setup:

1. Create a **blank canvas** with your ideal system prompt
2. Configure your preferred theme, temperature, and provider
3. Export this canvas as `template-default.json`
4. When starting a new project, **Import** this template

You can create multiple templates for different use cases:
- `template-code-review.json`: Low temperature, Mistral Large, system prompt for code
- `template-brainstorm.json`: High temperature, GPT-4o, creative system prompt
- `template-research.json`: Medium temperature, RAG enabled, analytical system prompt

---

## Quick Reference: Settings Summary

| Setting | Location | Range/Options | Default |
|---------|----------|--------------|---------|
| API Keys | Settings → API Keys | Mistral, OpenAI, Anthropic, Gemini | Empty |
| Ollama URL | Settings → Ollama | URL | `http://localhost:11434` |
| System Prompt | Settings → System Prompt | Free text | Empty |
| Temperature | Settings → Temperature | 0.0 - 2.0 | 0.7 |
| Theme | Settings → Theme | Void, Dusk, Sand, Snow, Sunrise | Auto-detected |
| Minimap | Settings → Canvas | On/Off | On |
| Confidence | Settings → Canvas | On/Off | On |
| Tendrils | Settings → Canvas | On/Off | On |
| Debate Models | Settings → Debate Models | Multi-select | None |

---

## Next Steps

- [[Advanced AI Features]] — Deep dive into each advanced feature
- [[Contributing Guide]] — Help improve Mosaic
- [[Keyboard Shortcuts and UI Reference]] — Complete UI documentation
