import { CONFIG, SELECTORS, STORAGE_KEYS } from './config.js';

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
  }

  init() {
    const stored = this.getStoredTheme();
    if (stored) {
      this.currentTheme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = CONFIG.theme.default;
    }
    this.applyTheme(this.currentTheme, false);

    const toggle = document.querySelector(SELECTORS.themeToggle);
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEYS.theme)) {
          this.applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  getStoredTheme() {
    return localStorage.getItem(STORAGE_KEYS.theme);
  }

  applyTheme(theme, persist = true) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    }
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  toggle() {
    this.applyTheme(this.currentTheme === 'dark' ? 'light' : 'dark', true);
  }

  getTheme() {
    return this.currentTheme;
  }
}

export const themeManager = new ThemeManager();
