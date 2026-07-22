export const CONFIG = {
  particles: {
    count: 48,
    reducedCountMobile: 18,
    mobileBreakpoint: 768,
    maxDistance: 120,
    speed: 0.35,
    size: { min: 0.5, max: 2.2 },
    opacity: { min: 0.1, max: 0.45 },
    pulseSpeed: 0.008,
  },
  theme: {
    default: 'dark',
    storageKey: 'jesus-theme',
  },
  search: {
    minQueryLength: 2,
    debounceMs: 150,
    maxResults: 8,
  },
  readingProgress: {
    enabled: true,
    color: 'var(--color-primary)',
  },
  share: {
    twitter: 'https://twitter.com/intent/tweet?text={title}&url={url}',
    whatsapp: 'https://wa.me/?text={title}%20{url}',
  },
};

export const SELECTORS = {
  particlesCanvas: '#particles-canvas',
  themeToggle: '.theme-toggle',
  searchInput: '#search-input',
  searchResults: '#search-results',
  searchContainer: '.search-container',
  shareButtons: '.share-btn',
  backToTop: '#back-to-top',
  readingProgress: '#reading-progress',
  postContent: '#post-content',
  mobileMenuBtn: '#mobile-menu-btn',
  mainNav: '.main-nav',
};

export const STORAGE_KEYS = {
  theme: 'jesus-theme',
  readPosts: 'jesus-read-posts',
  fontSize: 'jesus-font-size',
};

export const FONT_SIZES = [
  { label: 'Pequeno', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Grande', value: '1.125rem' },
  { label: 'Extra Grande', value: '1.25rem' },
];