const fs = require('fs');
const path = require('path');

const WIKI_DIR = path.join(__dirname, '..', 'wiki');
const OUT_DIR = path.join(__dirname, '..', 'website');

const categories = [
  {
    id: 'getting-started', title: 'Getting Started', icon: '⭐',
    desc: 'Install Mosaic, configure API providers, and send your first message on the branching canvas.',
    files: ['Home.md', 'Installation-Guide.md', 'Tutorial---Your-First-Conversation.md']
  },
  {
    id: 'user-guide', title: 'User Guide', icon: '◎',
    desc: 'Master the canvas, node system, provider integration, RAG pipeline, and advanced AI features.',
    files: ['Canvas-and-Node-System.md', 'LLM-Provider-Integration.md', 'RAG-System-Guide.md', 'Advanced-AI-Features.md', 'Keyboard-Shortcuts-and-UI-Reference.md']
  },
  {
    id: 'tutorials', title: 'Tutorials', icon: '→',
    desc: 'Step-by-step walkthroughs for branching, RAG, code execution, customization, and advanced workflows.',
    files: ['Tutorial---Branching-and-Parallel-Exploration.md', 'Tutorial---Using-RAG-with-Documents.md', 'Tutorial---Advanced-Features-in-Practice.md', 'Tutorial---Customizing-Mosaic.md', 'Tutorial---Running-Code-Inline.md']
  },
  {
    id: 'api-reference', title: 'API Reference', icon: '⎔',
    desc: 'Complete reference for Zustand stores, React hooks, UI components, utilities, and TypeScript types.',
    files: ['Store-API-Reference.md', 'Hook-API-Reference.md', 'Component-API-Reference.md', 'Utilities-and-Types-Reference.md']
  },
  {
    id: 'architecture', title: 'Architecture', icon: '△',
    desc: 'Deep dives into overall data flow, the Liquid Glass physics engine, code sandbox, provider protocol, and state management.',
    files: ['Overall-Architecture-and-Data-Flow.md', 'Liquid-Glass-Physics-Engine.md', 'Code-Sandbox-Architecture.md', 'Provider-Protocol-and-Streaming.md', 'State-Management-and-Persistence.md']
  },
  {
    id: 'security', title: 'Security & Operations', icon: '◈',
    desc: 'Security model, troubleshooting guide, deployment pipeline, and distribution details.',
    files: ['Security-Model.md', 'Troubleshooting-and-FAQ.md', 'Deployment-and-Distribution.md']
  },
  {
    id: 'community', title: 'Community', icon: '◆',
    desc: 'Contributing guide, changelog and roadmap, project governance, and future ideas.',
    files: ['Contributing-Guide.md', 'Changelog-and-Roadmap.md', 'Project-Governance-and-Community.md', 'Future-Ideas.md']
  }
];

const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function fileNameToWikiPage(file) {
  const name = file.replace(/\.md$/, '').replace(/-/g, ' ');
  return name;
}

function resolveWikiLink(linkText) {
  const slug = slugify(linkText.replace(/\s+/g, '-'));
  for (const cat of categories) {
    for (const f of cat.files) {
      const fname = f.replace(/\.md$/, '').replace(/-/g, ' ');
      if (slugify(fname) === slug) {
        return `${cat.id}.html#${slug}`;
      }
    }
  }
  return `#${slug}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertMarkdown(text) {
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];
  let inList = null;
  let listItems = [];
  let inBlockquote = false;
  let bqLines = [];

  function flushCode() {
    if (codeLines.length) {
      const code = codeLines.join('\n');
      const langAttr = codeLang ? ` class="language-${codeLang}"` : '';
      out.push(`<pre><code${langAttr}>${escapeHtml(code)}</code></pre>\n`);
      codeLines = [];
      codeLang = '';
    }
  }

  function flushTable() {
    if (tableRows.length > 1) {
      let header = '';
      let body = '';
      const isHeader = tableRows[0].isHeader;
      if (isHeader) {
        header = '<thead><tr>' + tableRows[0].cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>\n';
        for (let j = 1; j < tableRows.length; j++) {
          body += '<tr>' + tableRows[j].cells.map(c => `<td>${c}</td>`).join('') + '</tr>\n';
        }
      } else {
        for (const row of tableRows) {
          body += '<tr>' + row.cells.map(c => `<td>${c}</td>`).join('') + '</tr>\n';
        }
      }
      out.push(`<div class="glass" style="padding:0;overflow-x:auto"><table>\n${header}${body ? '<tbody>\n' + body + '</tbody>\n' : ''}</table></div>\n`);
    }
    tableRows = [];
  }

  function flushList() {
    if (inList && listItems.length) {
      const tag = inList === 'ul' ? 'ul' : 'ol';
      out.push(`<${tag}>\n${listItems.map(li => `<li>${li}</li>`).join('\n')}\n</${tag}>\n`);
      listItems = [];
      inList = null;
    }
  }

  function flushBq() {
    if (inBlockquote && bqLines.length) {
      out.push(`<blockquote><p>${bqLines.join(' ')}</p></blockquote>\n`);
      bqLines = [];
      inBlockquote = false;
    }
  }

  function inlineFormat(line) {
    // Code spans: `code`
    line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold: **text** or __text__
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
    line = line.replace(/_(.+?)_/g, '<em>$1</em>');
    // Images: ![alt](url)
    line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;margin:8px 0">');
    // Links: [text](url)
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Wiki links: [[Page Name]]
    line = line.replace(wikiLinkRegex, (_, name) => {
      const href = resolveWikiLink(name);
      return `<a href="${href}">${name}</a>`;
    });
    // Strikethrough: ~~text~~
    line = line.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return line;
  }

  for (i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trimEnd();

    // Code block fence
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushCode();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Empty line - flush pending
    if (trimmed === '') {
      flushTable();
      flushList();
      flushBq();
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushTable(); flushList(); flushBq();
      out.push('<hr>\n');
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushTable(); flushList();
      inBlockquote = true;
      bqLines.push(inlineFormat(trimmed.slice(2)));
      continue;
    }

    flushBq();

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(s => inlineFormat(s.trim()));
      // Skip separator row (| --- | --- |)
      if (/^[\s:|:-]+$/.test(trimmed) && trimmed.includes('-')) {
        if (tableRows.length > 0) {
          tableRows[0].isHeader = true;
        }
        continue;
      }
      inTable = true;
      tableRows.push({ cells, isHeader: false });
      continue;
    } else {
      flushTable();
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const hLevel = Math.min(level + 1, 4);
      const content = inlineFormat(headingMatch[2]);
      const id = slugify(headingMatch[2]);
      out.push(`<h${hLevel} id="${id}">${content}</h${hLevel}>\n`);
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)/);
    if (ulMatch) {
      flushTable();
      if (inList !== 'ul') { flushList(); inList = 'ul'; }
      listItems.push(inlineFormat(ulMatch[1]));
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      flushTable();
      if (inList !== 'ol') { flushList(); inList = 'ol'; }
      listItems.push(inlineFormat(olMatch[1]));
      continue;
    }

    flushList();

    // Regular paragraph
    // Checkboxes
    const cbMatch = trimmed.match(/^- \[([ x])\]\s+(.+)/);
    if (cbMatch) {
      const checked = cbMatch[1] === 'x' ? ' checked' : '';
      out.push(`<p><input type="checkbox" disabled${checked}> ${inlineFormat(cbMatch[2])}</p>\n`);
      continue;
    }

    if (trimmed) {
      out.push(`<p>${inlineFormat(trimmed)}</p>\n`);
    }
  }

  flushCode();
  flushTable();
  flushList();
  flushBq();

  return out.join('');
}

function buildPageHtml(content, navTitle, pageTitle) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="description" content="Mosaic documentation — ${pageTitle}">
<meta property="og:title" content="Mosaic — ${pageTitle}">
<meta name="theme-color" content="#08080c">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='1' y='1' width='13' height='13' rx='3' fill='%23c084fc'/%3E%3Crect x='18' y='1' width='13' height='13' rx='3' fill='%23c084fc' opacity='0.6'/%3E%3Crect x='1' y='18' width='13' height='13' rx='3' fill='%23c084fc' opacity='0.6'/%3E%3Crect x='18' y='18' width='13' height='13' rx='3' fill='%23c084fc' opacity='0.25'/%3E%3C/svg%3E">
<link rel="stylesheet" href="style.css">
<title>Mosaic — ${pageTitle}</title>
</head>
<body>

<canvas id="node-bg"></canvas>

<nav id="nav" role="navigation">
  <a href="index.html" class="logo">
    <svg viewBox="0 0 32 32" fill="currentColor"><rect x="1" y="1" width="13" height="13" rx="3" opacity="1"/><rect x="18" y="1" width="13" height="13" rx="3" opacity="0.65"/><rect x="1" y="18" width="13" height="13" rx="3" opacity="0.65"/><rect x="18" y="18" width="13" height="13" rx="3" opacity="0.3"/></svg>
    Mosaic
  </a>
  <div class="nav-links">
    <a href="index.html#features">Features</a>
    <a href="index.html#providers">Providers</a>
    <a href="technical.html">Technical</a>
    <a href="wiki.html">Docs</a>
    <a href="https://github.com/versus184-py/Mosaic" target="_blank">GitHub</a>
  </div>
  <a href="index.html#download" class="nav-cta">Download</a>
  <button class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <a href="index.html#features">Features</a>
  <a href="index.html#providers">Providers</a>
  <a href="technical.html">Technical</a>
  <a href="wiki.html">Docs</a>
  <a href="https://github.com/versus184-py/Mosaic" target="_blank">GitHub</a>
  <a href="index.html#download" class="nav-cta">Download</a>
</div>

${content}

<footer class="footer">
  <div class="footer-inner">
    <span class="footer-copy">&copy; 2026 Mosaic. MIT License.</span>
    <div class="footer-links">
      <a href="wiki.html">Docs</a>
      <a href="https://github.com/versus184-py/Mosaic/releases" target="_blank">Releases</a>
      <a href="https://github.com/versus184-py/Mosaic" target="_blank">GitHub</a>
    </div>
  </div>
</footer>

<div class="theme-picker" role="radiogroup" aria-label="Theme">
  <button class="theme-btn active" data-theme="dusk" onclick="applyTheme('dusk')">Dusk</button>
  <button class="theme-btn" data-theme="sand" onclick="applyTheme('sand')">Sand</button>
</div>

<script src="theme.js"></script>
<script>
// TOC active state tracking (category pages)
(function(){
  const tocLinks=document.querySelectorAll('.tech-toc a');
  if(!tocLinks.length)return;
  window.addEventListener('scroll',()=>{
    let current='';
    const sections=document.querySelectorAll('.tech-content section');
    sections.forEach(s=>{const t=s.getBoundingClientRect();if(t.top<=180)current=s.id});
    tocLinks.forEach(a=>{a.classList.toggle('active',a.getAttribute('href')==='#'+current)});
  },{passive:true});
})();
</script>
<script>
// Node background
(function(){
  const canvas = document.getElementById('node-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let nodes = [], w, h, accent;
  const NODE_COUNT = 35, CONN_DIST = 180;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function getAccent() {
    const el = document.documentElement;
    const c = getComputedStyle(el).getPropertyValue('--accent').trim();
    const d = document.createElement('div');
    d.style.color = c; document.body.appendChild(d);
    const rgb = getComputedStyle(d).color;
    d.remove();
    const m = rgb.match(/[\\d.]+/g);
    return m ? { r:+m[0], g:+m[1], b:+m[2] } : { r:196, g:154, b:60 };
  }
  class Node {
    constructor() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = 2 + Math.random() * 3;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
    }
  }
  function init() {
    resize();
    nodes = Array.from({ length: NODE_COUNT }, () => new Node());
    accent = getAccent();
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    accent = getAccent();
    const { r, g, b } = accent;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONN_DIST) {
          const alpha = (1 - dist / CONN_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = \`rgba(\${r},\${g},\${b},\${alpha})\`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = \`rgba(\${r},\${g},\${b},0.5)\`;
      ctx.fill();
      ctx.shadowColor = \`rgba(\${r},\${g},\${b},0.3)\`;
      ctx.shadowBlur = 8;
    });
    ctx.shadowBlur = 0;
    nodes.forEach(n => n.update());
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { resize(); if (nodes.length) nodes.forEach(n => { n.x = Math.min(n.x, w); n.y = Math.min(n.y, h) }) });
  init();
  draw();
})();
</script>
</body>
</html>`;
}

// Build hub page
function buildHubPage() {
  let cards = categories.map(cat => {
    const count = cat.files.length;
    return `<a href="${cat.id}.html" class="wiki-card glass">
  <div class="glass-edge"></div>
  <span class="wiki-card-icon">${cat.icon}</span>
  <h3>${cat.title}</h3>
  <p>${cat.desc}</p>
  <span class="wiki-card-count">${count} article${count > 1 ? 's' : ''}</span>
</a>`;
  }).join('\n');

  const content = `<section class="tech-hero">
  <h1>Documentation</h1>
  <p>Comprehensive guides, tutorials, API references, and architecture deep-dives for Mosaic.</p>
</section>

<div class="wiki-grid">
  ${cards}
</div>`;

  return buildPageHtml(content, 'Docs', 'Documentation');
}

// Build category page
function buildCategoryPage(cat) {
  let tocItems = [];
  let sections = [];

  cat.files.forEach(file => {
    const filePath = path.join(WIKI_DIR, file);
    const md = fs.readFileSync(filePath, 'utf-8');
    const html = convertMarkdown(md);

    // Extract first h2 for section title
    const titleMatch = md.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
    const id = slugify(title);

    tocItems.push(`<a href="#${id}">${title}</a>`);
    sections.push(`<section id="${id}">${html}</section>`);
  });

  const content = `<section class="tech-hero">
  <h1>${cat.title}</h1>
  <p>${cat.desc}</p>
</section>

<div class="tech-layout">
  <aside class="tech-toc" id="toc">
    <div class="tech-toc-inner glass">
      <div class="tech-toc-title">${cat.title}</div>
      ${tocItems.join('\n')}
      <a href="wiki.html" style="margin-top:8px;color:var(--accent)">&larr; All docs</a>
    </div>
  </aside>
  <main class="tech-content">
    ${sections.join('\n')}
  </main>
</div>`;

  return buildPageHtml(content, cat.title, cat.title + ' — Documentation');
}

// Main
console.log('Building wiki pages...');

// Hub
const hubHtml = buildHubPage();
fs.writeFileSync(path.join(OUT_DIR, 'wiki.html'), hubHtml);
console.log('  ✓ wiki.html');

// Categories
for (const cat of categories) {
  const html = buildCategoryPage(cat);
  fs.writeFileSync(path.join(OUT_DIR, `${cat.id}.html`), html);
  console.log(`  ✓ ${cat.id}.html`);
}

console.log('Done!');
