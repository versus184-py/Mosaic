// ===== Mosaic Website — Theme Engine =====

const THEMES = ['dusk','sand'];
const DARK_THEMES = ['dusk'];

function getThemePreference() {
  const stored = localStorage.getItem('mosaic-theme');
  if (stored && THEMES.includes(stored)) return stored;
  const h = new Date().getHours();
  return (h >= 6 && h < 18) ? 'sand' : 'dusk';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mosaic-theme', theme);
  // Update picker UI
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  // Update screenshot images
  const isDark = DARK_THEMES.includes(theme);
  document.querySelectorAll('.screenshot').forEach(img => {
    const src = isDark ? img.dataset.srcDark : img.dataset.srcLight;
    if (src && img.src !== src) img.src = src;
  });
}

// Initialize theme
applyTheme(getThemePreference());

// Listen for system color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('mosaic-theme')) {
    applyTheme(e.matches ? 'dusk' : 'sand');
  }
});

// ===== SCROLL REVEAL =====
(function(){
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const o = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => o.observe(el));
})();

// ===== CODE BLOCKS: language labels + copy buttons =====
(function(){
  const pres = document.querySelectorAll('.tech-content pre');
  pres.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const cls = code.className;
    const lang = cls.replace(/^language-/, '').replace(/^syntax$/, '');
    if (lang) pre.setAttribute('data-lang', lang);
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const text = code.textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
    pre.appendChild(btn);
  });
})();

// ===== TABLE WRAPPING =====
(function(){
  document.querySelectorAll('.tech-content table').forEach(table => {
    if (!table.parentElement.classList.contains('table-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    }
  });
})();

// ===== NAV HIDE/SHOW =====
(function(){
  let last = 0;
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    const cur = window.scrollY;
    nav.classList.toggle('nav-hidden', cur > last && cur > 120);
    last = cur;
  }, { passive: true });
})();

// ===== HAMBURGER MENU =====
(function(){
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

// ===== WIKI SEARCH ENGINE =====
(function(){
  if (typeof MiniSearch === 'undefined') { window.wikiSearch = null; return; }

  let miniSearch = null;
  let searchPromise = null;

  async function initSearch() {
    if (searchPromise) return searchPromise;
    searchPromise = (async () => {
      const resp = await fetch('search-index.json');
      const docs = await resp.json();
      miniSearch = new MiniSearch({
        fields: ['title', 'headings', 'content'],
        storeFields: ['title', 'category', 'categoryId', 'url', 'excerpt', 'headings'],
        searchOptions: { boost: { title: 5, headings: 3, content: 1 }, prefix: true, fuzzy: 0.2 }
      });
      miniSearch.addAll(docs);
    })();
    return searchPromise;
  }

  function highlightText(text, query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let result = text;
    terms.forEach(term => {
      const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      result = result.replace(re, '<mark>$1</mark>');
    });
    return result;
  }

  function renderResults(results, query) {
    if (!results.length) {
      return '<div class="wiki-empty" style="display:flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>No results found</h3><p>Try different keywords, or browse the categories above.</p></div>';
    }
    return results.map(r => {
      const excerpt = highlightText(r.excerpt, query);
      const headings = r.headings ? r.headings.slice(0, 4).map(h => '<span>' + h + '</span>').join('') : '';
      const pct = Math.min(100, Math.round(r.score * 50));
      return '<a href="' + r.url + '" class="wiki-result-card glass">' +
        '<div class="glass-edge"></div>' +
        '<div class="wiki-result-top">' +
          '<span class="wiki-result-badge">' + r.category + '</span>' +
          '<span class="wiki-result-score">' + pct + '% match</span>' +
        '</div>' +
        '<h3 class="wiki-result-title">' + r.title + '</h3>' +
        '<p class="wiki-result-excerpt">' + excerpt + '</p>' +
        (headings ? '<div class="wiki-result-headings">' + headings + '</div>' : '') +
      '</a>';
    }).join('');
  }

  window.wikiSearch = async function(query, resultsContainer, opts) {
    opts = opts || {};
    const grid = opts.grid || null;
    const quickLinks = opts.quickLinks || null;
    const techLayout = opts.techLayout || null;
    const emptyEl = opts.emptyEl || null;

    if (!miniSearch) await initSearch();
    if (!miniSearch) return;

    if (!query.trim()) {
      if (grid) grid.style.display = '';
      if (quickLinks) quickLinks.style.display = '';
      if (techLayout) techLayout.style.display = '';
      if (resultsContainer) { resultsContainer.style.display = 'none'; resultsContainer.innerHTML = ''; }
      return;
    }

    const results = miniSearch.search(query, { prefix: true, fuzzy: 0.2 });

    if (grid) grid.style.display = 'none';
    if (quickLinks) quickLinks.style.display = 'none';
    if (techLayout) techLayout.style.display = 'none';

    if (resultsContainer) {
      resultsContainer.style.display = '';
      resultsContainer.innerHTML = renderResults(results, query);
    }
  };

  // Keyboard shortcut: / to focus any search input
  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      const input = document.querySelector('.wiki-search');
      if (input) { e.preventDefault(); input.focus(); }
    }
    if (e.key === 'Escape' && document.activeElement && document.activeElement.classList.contains('wiki-search')) {
      document.activeElement.blur();
    }
  });

  // Auto-init search index on first interaction with any search input
  document.addEventListener('focusin', function(e) {
    if (e.target && e.target.classList.contains('wiki-search') && !miniSearch) {
      initSearch();
    }
  });
})();
