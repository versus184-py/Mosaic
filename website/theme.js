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
