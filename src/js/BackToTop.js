import { SELECTORS } from './config.js';

class BackToTop {
  constructor() {
    this.button = null;
    this.visible = false;
    this.scrollThreshold = 300;
  }

  init() {
    this.button = document.getElementById('back-to-top');
    if (!this.button) {
      this.createButton();
    }
    
    this.bindEvents();
  }

  createButton() {
    this.button = document.createElement('button');
    this.button.id = 'back-to-top';
    this.button.setAttribute('aria-label', 'Voltar ao topo');
    this.button.innerHTML = '<i class="bi bi-arrow-up"></i>';
    document.body.appendChild(this.button);
  }

  bindEvents() {
    let ticking = false;
    
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const shouldShow = scrollY > this.scrollThreshold;
          
          if (shouldShow !== this.visible) {
            this.visible = shouldShow;
            this.button.classList.toggle('visible', shouldShow);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    
    this.button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

export const backToTop = new BackToTop();