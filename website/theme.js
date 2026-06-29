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
