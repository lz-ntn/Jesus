import { SELECTORS } from './config.js';

class ReadingProgress {
  constructor() {
    this.bar = null;
    this.enabled = true;
  }

  init() {
    if (!this.enabled) return;
    
    this.bar = document.getElementById('reading-progress');
    if (!this.bar) {
      this.createBar();
    }
    
    if (this.bar) {
      this.bindEvents();
    }
  }

  createBar() {
    this.bar = document.createElement('div');
    this.bar.id = 'reading-progress';
    this.bar.setAttribute('role', 'progressbar');
    this.bar.setAttribute('aria-valuemin', '0');
    this.bar.setAttribute('aria-valuemax', '100');
    this.bar.setAttribute('aria-label', 'Progresso da leitura');
    document.body.appendChild(this.bar);
  }

  bindEvents() {
    let ticking = false;
    
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      this.bar.style.transform = `scaleX(${scrollPercent / 100})`;
      this.bar.setAttribute('aria-valuenow', Math.round(scrollPercent));
      
      ticking = false;
    };
    
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

export const readingProgress = new ReadingProgress();