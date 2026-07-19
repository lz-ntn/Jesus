import { CONFIG, SELECTORS } from './config.js';

class ShareManager {
  constructor() {
    this.buttons = [];
  }

  init() {
    this.buttons = document.querySelectorAll(SELECTORS.shareButtons);
    this.bindEvents();
  }

  bindEvents() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.share(action, btn);
      });
    });
  }

  async share(action, btn) {
    const title = document.title.replace(' | Jesus, sem filtros', '');
    const url = window.location.href;
    
    const shareData = {
      title,
      text: title,
      url,
    };

    try {
      switch (action) {
        case 'copy':
          await navigator.clipboard.writeText(url);
          this.showToast(btn, 'Link copiado!');
          break;
          
        case 'twitter':
          const twitterUrl = CONFIG.share.twitter
            .replace('{title}', encodeURIComponent(title))
            .replace('{url}', encodeURIComponent(url));
          window.open(twitterUrl, '_blank', 'width=550,height=420');
          break;
          
        case 'whatsapp':
          const waUrl = CONFIG.share.whatsapp
            .replace('{title}', encodeURIComponent(title))
            .replace('{url}', encodeURIComponent(url));
          window.open(waUrl, '_blank');
          break;
          
        case 'email':
          const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`;
          window.location.href = mailtoUrl;
          break;
          
        default:
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(url);
            this.showToast(btn, 'Link copiado!');
          }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        await navigator.clipboard.writeText(url);
        this.showToast(btn, 'Link copiado!');
      }
    }
  }

  showToast(btn, message) {
    const existing = btn.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('span');
    toast.className = 'toast';
    toast.textContent = message;
    btn.style.position = 'relative';
    btn.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }
}

export const shareManager = new ShareManager();