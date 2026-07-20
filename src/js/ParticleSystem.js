import { CONFIG, SELECTORS } from './config.js';

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

function getParticleColor() {
  const colorVar = getCssVariable('--color-primary');
  if (colorVar.startsWith('#')) {
    return hexToRgb(colorVar);
  }
  return { r: 201, g: 162, b: 39 };
}

class ParticleSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.config = CONFIG.particles;
    this.color = { r: 201, g: 162, b: 39 };
    this.isMobile = false;
    this.resizeTimeout = null;
  }

  init() {
    this.canvas = document.querySelector(SELECTORS.particlesCanvas);
    if (!this.canvas) return;
    
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reducedMotion) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.isMobile = window.innerWidth < this.config.mobileBreakpoint;
    
    this.color = getParticleColor();
    this.resize();
    this.createParticles();
    this.animate();
    
    window.addEventListener('resize', this.handleResize.bind(this));
    
    const mediaQuery = window.matchMedia(`(max-width: ${this.config.mobileBreakpoint - 1}px)`);
    mediaQuery.addEventListener('change', () => {
      this.isMobile = mediaQuery.matches;
      this.createParticles();
    });
    
    document.addEventListener('themechange', () => {
      this.color = getParticleColor();
    });
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.target === this.canvas) {
            this.animationPaused = !entry.isIntersecting;
          }
        });
      }, { rootMargin: '200px' });
      observer.observe(this.canvas);
    }
  }

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.resize();
    }, 100);
  }

  resize() {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.particles.forEach(p => {
      p.x = Math.min(p.x, this.canvas.width / window.devicePixelRatio);
      p.y = Math.min(p.y, this.canvas.height / window.devicePixelRatio);
    });
  }

  createParticles() {
    const count = this.isMobile ? this.config.reducedCountMobile : this.config.count;
    this.particles = [];
    
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * (this.canvas.width / window.devicePixelRatio),
      y: Math.random() * (this.canvas.height / window.devicePixelRatio),
      size: Math.random() * (this.config.size.max - this.config.size.min) + this.config.size.min,
      speedX: (Math.random() - 0.5) * this.config.speed,
      speedY: (Math.random() - 0.5) * this.config.speed,
      opacity: Math.random() * (this.config.opacity.max - this.config.opacity.min) + this.config.opacity.min,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  animate() {
    if (this.animationPaused) {
      this.animationId = requestAnimationFrame(() => this.animate());
      return;
    }
    
    const canvas = this.canvas;
    const ctx = this.ctx;
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, width, height);
    
    this.particles.forEach(p => {
      this.updateParticle(p, width, height);
      this.drawParticle(ctx, p);
    });
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        this.drawConnection(ctx, this.particles[i], this.particles[j]);
      }
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  updateParticle(p, width, height) {
    p.x += p.speedX;
    p.y += p.speedY;
    p.pulse += 0.008;
    
    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
    }
  }

  drawParticle(ctx, p) {
    const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawConnection(ctx, p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.config.maxDistance) {
      const alpha = (1 - dist / this.config.maxDistance) * 0.15;
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.handleResize);
  }
}

export const particleSystem = new ParticleSystem();