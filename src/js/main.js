import { particleSystem } from './ParticleSystem.js';
import { themeManager } from './ThemeManager.js';
import { readingProgress } from './ReadingProgress.js';
import { searchEngine } from './SearchEngine.js';
import { shareManager } from './ShareManager.js';
import { backToTop } from './BackToTop.js';
import { CONFIG, SELECTORS } from './config.js';

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createParticle(ctx, canvas, config) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * (config.size.max - config.size.min) + config.size.min,
    speedX: (Math.random() - 0.5) * config.speed,
    speedY: (Math.random() - 0.5) * config.speed,
    opacity: Math.random() * (config.opacity.max - config.opacity.min) + config.opacity.min,
    pulse: Math.random() * Math.PI * 2,
  };
}

function updateParticle(p, canvas, config) {
  p.x += p.speedX;
  p.y += p.speedY;
  p.pulse += config.pulseSpeed;
  
  if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
    p.x = Math.random() * canvas.width;
    p.y = Math.random() * canvas.height;
  }
}

function drawParticle(ctx, p, color) {
  const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
}

function drawConnection(ctx, p1, p2, color, maxDist) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < maxDist) {
    const alpha = (1 - dist / maxDist) * 0.15;
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

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
  initFontSizeControls();
  
  const isPostPage = document.querySelector('.post-page');
  const isSearchPage = document.querySelector(SELECTORS.searchInput);
  
  if (isSearchPage) {
    await searchEngine.init();
  }
  
  console.log('Jesus, sem filtros - carregado com sucesso');
}

init();