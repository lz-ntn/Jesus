import { CONFIG, SELECTORS } from './config.js';

class SearchEngine {
  constructor() {
    this.index = [];
    this.initialized = false;
  }

  async init() {
    const input = document.querySelector(SELECTORS.searchInput);
    const results = document.querySelector(SELECTORS.searchResults);
    
    if (!input || !results) return;
    
    await this.loadIndex();
    this.bindEvents(input, results);
    this.initialized = true;
  }

  async loadIndex() {
    try {
      const response = await fetch('/data/posts-index.json');
      if (response.ok) {
        this.index = await response.json();
      }
    } catch (e) {
      console.warn('Search index not available:', e);
      this.index = [];
    }
  }

  bindEvents(input, results) {
    let debounceTimer;
    
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.search(e.target.value, results);
      }, CONFIG.search.debounceMs);
    });
    
    input.addEventListener('focus', () => {
      if (input.value.length >= CONFIG.search.minQueryLength) {
        this.search(input.value, results);
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest(SELECTORS.searchContainer)) {
        results.classList.remove('active');
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        results.classList.remove('active');
        input.blur();
      }
    });
  }

  search(query, resultsContainer) {
    const cleanQuery = query.trim().toLowerCase();
    
    if (cleanQuery.length < CONFIG.search.minQueryLength) {
      resultsContainer.classList.remove('active');
      return;
    }
    
    const terms = cleanQuery.split(/\s+/).filter(t => t.length > 0);
    const matches = this.index
      .map(post => ({
        ...post,
        score: this.calculateScore(post, terms),
      }))
      .filter(post => post.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, CONFIG.search.maxResults);
    
    this.renderResults(matches, resultsContainer, cleanQuery);
    resultsContainer.classList.add('active');
  }

  calculateScore(post, terms) {
    let score = 0;
    const title = (post.title || '').toLowerCase();
    const excerpt = (post.excerpt || '').toLowerCase();
    const tags = (post.tags || []).join(' ').toLowerCase();
    const content = (post.content || '').toLowerCase();
    
    terms.forEach(term => {
      if (title.includes(term)) score += 10;
      if (tags.includes(term)) score += 5;
      if (excerpt.includes(term)) score += 2;
      if (content.includes(term)) score += 1;
      
      if (title.startsWith(term)) score += 5;
      if (title.includes(` ${term}`)) score += 3;
    });
    
    return score;
  }

  renderResults(matches, container, query) {
    if (matches.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="bi bi-search"></i>
          <p>Nenhum resultado para "<strong>${this.escapeHtml(query)}</strong>"</p>
          <small>Tente termos diferentes ou mais gerais</small>
        </div>
      `;
      return;
    }
    
    container.innerHTML = matches.map(post => `
      <a href="/posts/${post.slug}.html" class="search-result-item">
        <h3>${this.highlightText(post.title, query)}</h3>
        <p class="result-excerpt">${this.highlightText(post.excerpt, query)}</p>
        <div class="result-meta">
          <time>${this.formatDate(post.date)}</time>
          <span class="reading-time"><i class="bi bi-clock"></i> ${post.readingTime} min</span>
          <div class="result-tags">
            ${(post.tags || []).slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </a>
    `).join('');
  }

  highlightText(text, query) {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0);
    let result = this.escapeHtml(text);
    
    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return result;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

export const searchEngine = new SearchEngine();