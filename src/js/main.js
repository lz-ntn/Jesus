import { particleSystem } from './ParticleSystem.js';
import { themeManager } from './ThemeManager.js';
import { readingProgress } from './ReadingProgress.js';
import { searchEngine } from './SearchEngine.js';
import { shareManager } from './ShareManager.js';
import { backToTop } from './BackToTop.js';
import { loadHomePage } from './home-page.js';
import { SELECTORS } from './config.js';

function enhancePostContent() {
  const content = document.querySelector(SELECTORS.postContent);
  if (!content) return;
  
  content.querySelectorAll('h2, h3, h4').forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
    heading.style.scrollMarginTop = '100px';
  });
  
  content.querySelectorAll('blockquote').forEach(blockquote => {
    blockquote.classList.add('enhanced-quote');
  });
  
  content.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (code) {
      pre.classList.add('code-block');
      const lang = code.className.match(/language-(\w+)/)?.[1] || '';
      if (lang) {
        pre.dataset.language = lang;
      }
    }
  });
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { rootMargin: '50px', threshold: 0.1 });
    
    content.querySelectorAll('p, blockquote, pre, ul, ol, h2, h3').forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }
}

function initMobileMenu() {
  const btn = document.querySelector(SELECTORS.mobileMenuBtn);
  const nav = document.querySelector(SELECTORS.mainNav);
  
  if (!btn || !nav) return;
  
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    nav.classList.toggle('mobile-open');
    document.body.classList.toggle('nav-open');
  });
  
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('mobile-open');
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
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
      
      const nav = document.querySelector(SELECTORS.mainNav);
      if (nav?.classList.contains('mobile-open')) {
        nav.classList.remove('mobile-open');
        document.body.classList.remove('nav-open');
        document.querySelector(SELECTORS.mobileMenuBtn)?.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

function initFontSizeControls() {
  const controls = document.querySelectorAll('[data-font-size]');
  controls.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.fontSize;
      document.documentElement.style.fontSize = size;
      localStorage.setItem('font-size', size);
      controls.forEach(b => b.classList.toggle('active', b === btn));
    });
  });
  
  const savedSize = localStorage.getItem('font-size');
  if (savedSize) {
    document.documentElement.style.fontSize = savedSize;
  }
}

async function init() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }
  
  themeManager.init();
  particleSystem.init();
  readingProgress.init();
  shareManager.init();
  backToTop.init();
  enhancePostContent();
  initMobileMenu();
  initKeyboardNavigation();

  const isHomePage = document.querySelector('.hero');
  if (isHomePage) {
    await loadHomePage();
  }
  
  const isPostPage = document.querySelector('.post-page');
  const isSearchPage = document.querySelector(SELECTORS.searchInput);
  
  if (isSearchPage) {
    await searchEngine.init();
  }
  
  console.log('Jesus, sem filtros - carregado com sucesso');
}

init();