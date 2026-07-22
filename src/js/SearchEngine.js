import { CONFIG, SELECTORS } from './config.js';
import { getPostsIndex, formatDate, escapeHtml } from './posts-data.js';

class SearchEngine {
  constructor() {
    this.index = [];
    this.initialized = false;
    this.activeIndex = -1;
  }

  async init() {
    const input = document.querySelector(SELECTORS.searchInput);
    const results = document.querySelector(SELECTORS.searchResults);
    if (!input || !results) return;

    this.index = await getPostsIndex();
    this.bindEvents(input, results);
    this.initialized = true;
  }

  bindEvents(input, results) {
    let debounceTimer;

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      this.activeIndex = -1;
      debounceTimer = setTimeout(() => {
        this.search(e.target.value, results);
      }, CONFIG.search.debounceMs);
    });

    input.addEventListener('focus', () => {
      if (input.value.length >= CONFIG.search.minQueryLength) {
        this.search(input.value, results);
      }
    });

    input.addEventListener('keydown', (e) => {
      const items = [...results.querySelectorAll('.search-result-item')];
      if (!results.classList.contains('active') || items.length === 0) {
        if (e.key === 'Escape') {
          results.classList.remove('active');
          input.blur();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % items.length;
        this.updateActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
        this.updateActive(items);
      } else if (e.key === 'Enter' && this.activeIndex >= 0) {
        e.preventDefault();
        items[this.activeIndex].click();
      } else if (e.key === 'Escape') {
        results.classList.remove('active');
        this.activeIndex = -1;
        input.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest(SELECTORS.searchContainer)) {
        results.classList.remove('active');
        this.activeIndex = -1;
      }
    });
  }

  updateActive(items) {
    items.forEach((el, i) => el.classList.toggle('is-active', i === this.activeIndex));
    items[this.activeIndex]?.scrollIntoView({ block: 'nearest' });
  }

  search(query, resultsContainer) {
    const cleanQuery = query.trim().toLowerCase();

    if (cleanQuery.length < CONFIG.search.minQueryLength) {
      resultsContainer.classList.remove('active');
      return;
    }

    const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 0);
    const matches = this.index
      .map((post) => ({
        ...post,
        score: this.calculateScore(post, terms),
      }))
      .filter((post) => post.score > 0)
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

    terms.forEach((term) => {
      if (title.includes(term)) score += 10;
      if (tags.includes(term)) score += 5;
      if (excerpt.includes(term)) score += 2;
      if (title.startsWith(term)) score += 5;
      if (title.includes(` ${term}`)) score += 3;
    });

    return score;
  }

  renderResults(matches, container, query) {
    if (matches.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="bi bi-search" aria-hidden="true"></i>
          <p>Nenhum resultado para "<strong>${escapeHtml(query)}</strong>"</p>
          <small>Tente termos diferentes ou mais gerais</small>
        </div>
      `;
      return;
    }

    container.innerHTML = matches
      .map(
        (post) => `
      <a href="/posts/${escapeHtml(post.slug)}.html" class="search-result-item" role="option">
        <h3>${this.highlightText(post.title, query)}</h3>
        <p class="result-excerpt">${this.highlightText(post.excerpt, query)}</p>
        <div class="result-meta">
          <time>${formatDate(post.date, { day: '2-digit', month: 'short', year: 'numeric' })}</time>
          <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
          <div class="result-tags">
            ${(post.tags || [])
              .slice(0, 3)
              .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
              .join('')}
          </div>
        </div>
      </a>
    `
      )
      .join('');
  }

  highlightText(text, query) {
    const terms = query.trim().toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    let result = escapeHtml(text);

    terms.forEach((term) => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
  }

  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const searchEngine = new SearchEngine();
