import { particleSystem } from './ParticleSystem.js';
import { themeManager } from './ThemeManager.js';
import { readingProgress } from './ReadingProgress.js';
import { searchEngine } from './SearchEngine.js';
import { shareManager } from './ShareManager.js';
import { backToTop } from './BackToTop.js';
import { loadHomePage } from './home-page.js';
import { loadPostsPage } from './posts-page.js';
import { loadTagsPage } from './tags-page.js';
import { loadArchivePage } from './archive-page.js';
import { SELECTORS } from './config.js';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function enhancePostContent() {
  const content = document.querySelector(SELECTORS.postContent);
  if (!content) return;

  content.querySelectorAll('h2, h3, h4').forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      heading.id = text || `heading-${index}`;
    }
    heading.style.scrollMarginTop = '100px';
  });

  content.querySelectorAll('blockquote').forEach((blockquote) => {
    blockquote.classList.add('enhanced-quote');
  });

  content.querySelectorAll('pre').forEach((pre) => {
    const code = pre.querySelector('code');
    if (code) {
      pre.classList.add('code-block');
      const lang = code.className.match(/language-(\w+)/)?.[1] || '';
      if (lang) pre.dataset.language = lang;
    }
  });

  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '40px', threshold: 0.08 }
    );

    content.querySelectorAll('p, blockquote, pre, ul, ol, h2, h3').forEach((el) => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }
}

function initMobileMenu() {
  const btn = document.querySelector(SELECTORS.mobileMenuBtn);
  const nav = document.querySelector(SELECTORS.mainNav);
  if (!btn || !nav) return;

  const close = () => {
    nav.classList.remove('mobile-open');
    document.body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
  };

  const open = () => {
    nav.classList.add('mobile-open');
    document.body.classList.add('nav-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Fechar menu');
    nav.querySelector('.nav-link')?.focus();
  };

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? close() : open();
  });

  nav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', close);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
      close();
      btn.focus();
    }
  });
}

function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable) {
      const searchInput = document.querySelector(SELECTORS.searchInput);
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }

    if (e.key === 'Escape') {
      const searchResults = document.querySelector(SELECTORS.searchResults);
      if (searchResults?.classList.contains('active')) {
        searchResults.classList.remove('active');
        document.querySelector(SELECTORS.searchInput)?.blur();
      }
    }
  });
}

function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initLinkPrefetch() {
  if (!('connection' in navigator) || navigator.connection?.saveData) return;
  if (navigator.connection?.effectiveType?.includes('2g')) return;

  const prefetched = new Set();
  const prefetch = (href) => {
    if (!href || prefetched.has(href) || !href.startsWith('/') || href.startsWith('//')) return;
    if (href.includes('#')) href = href.split('#')[0];
    if (!href || prefetched.has(href)) return;
    prefetched.add(href);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  };

  document.addEventListener(
    'pointerenter',
    (e) => {
      const a = e.target.closest?.('a[href^="/posts/"], a[href^="/tags/"]');
      if (a) prefetch(a.getAttribute('href'));
    },
    true
  );
}

function initParticlesLazy() {
  if (prefersReducedMotion()) return;
  if (!document.querySelector(SELECTORS.particlesCanvas)) return;

  const start = () => particleSystem.init();

  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 1800 });
  } else {
    setTimeout(start, 400);
  }
}

async function init() {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve));
  }

  themeManager.init();
  initHeaderScroll();
  shareManager.init();
  backToTop.init();
  initMobileMenu();
  initKeyboardNavigation();
  initLinkPrefetch();

  if (document.querySelector('.post-page')) {
    readingProgress.init();
    enhancePostContent();
  }

  initParticlesLazy();

  if (document.querySelector('.hero')) {
    await loadHomePage();
  } else if (document.getElementById('posts-grid') && document.getElementById('sort-select')) {
    await loadPostsPage();
  } else if (document.getElementById('tag-cloud')) {
    await loadTagsPage();
  } else if (document.getElementById('archive')) {
    await loadArchivePage();
  } else if (document.querySelector(SELECTORS.searchInput)) {
    await searchEngine.init();
  }
}

init();
