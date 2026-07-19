import { CONFIG, SELECTORS, STORAGE_KEYS } from './config.js';

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
  }

  init() {
    this.currentTheme = this.getStoredTheme() || CONFIG.theme.default;
    this.applyTheme(this.currentTheme);
    
    const toggle = document.querySelector(SELECTORS.themeToggle);
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }
    
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEYS.theme)) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  getStoredTheme() {
    return localStorage.getItem(STORAGE_KEYS.theme);
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  toggle() {
    this.applyTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
  }

  getTheme() {
    return this.currentTheme;
  }
}

export const themeManager = new ThemeManager();