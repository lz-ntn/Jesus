import { getPostsIndex, createPostCard, formatDate, escapeHtml } from './posts-data.js';

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const POSTS_PER_PAGE = 9;

export async function loadPostsPage() {
  allPosts = await getPostsIndex();
  filteredPosts = [...allPosts];
  setupSearch();
  setupSort();
  renderPosts();
  renderPagination();
}

function setupSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  let debounceTimer;
  let activeIndex = -1;

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    activeIndex = -1;
    debounceTimer = setTimeout(() => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        results.classList.remove('active');
        results.innerHTML = '';
        filteredPosts = [...allPosts];
        currentPage = 1;
        applyCurrentSort();
        renderPosts();
        renderPagination();
        return;
      }

      filteredPosts = allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          (post.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );

      currentPage = 1;
      applyCurrentSort();
      renderPosts();
      renderPagination();
      showSearchResults(query, results);
    }, 150);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      showSearchResults(input.value.trim().toLowerCase(), results);
    }
  });

  input.addEventListener('keydown', (e) => {
    const items = [...results.querySelectorAll('.search-result-item')];
    if (!results.classList.contains('active') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActive(items, activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActive(items, activeIndex);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    } else if (e.key === 'Escape') {
      results.classList.remove('active');
      activeIndex = -1;
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      results.classList.remove('active');
      activeIndex = -1;
    }
  });
}

function updateActive(items, index) {
  items.forEach((el, i) => el.classList.toggle('is-active', i === index));
  items[index]?.scrollIntoView({ block: 'nearest' });
}

function showSearchResults(query, container) {
  const matches = allPosts
    .filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        (post.tags || []).some((tag) => tag.toLowerCase().includes(query))
    )
    .slice(0, 5);

  if (matches.length === 0) {
    container.innerHTML = '<div class="no-results">Nenhum resultado encontrado</div>';
  } else {
    container.innerHTML = matches
      .map(
        (post) => `
      <a href="/posts/${escapeHtml(post.slug)}.html" class="search-result-item" role="option">
        <h4>${highlightMatch(post.title, query)}</h4>
        <p>${highlightMatch(post.excerpt, query)}</p>
        <div class="result-meta">
          <time>${formatDate(post.date, { day: '2-digit', month: 'short', year: 'numeric' })}</time>
          <span>${post.readingTime} min</span>
        </div>
      </a>
    `
      )
      .join('');
  }
  container.classList.add('active');
}

function highlightMatch(text, query) {
  const safe = escapeHtml(text || '');
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function setupSort() {
  const select = document.getElementById('sort-select');
  if (!select) return;

  select.addEventListener('change', () => {
    applyCurrentSort();
    currentPage = 1;
    renderPosts();
    renderPagination();
  });
}

function applyCurrentSort() {
  const select = document.getElementById('sort-select');
  sortPosts(select?.value || 'date-desc');
}

function sortPosts(criteria) {
  const sorted = [...filteredPosts];

  switch (criteria) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
      break;
    case 'reading-time':
      sorted.sort((a, b) => a.readingTime - b.readingTime);
      break;
  }

  filteredPosts = sorted;
}

function renderPosts() {
  const grid = document.getElementById('posts-grid');
  if (!grid) return;

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);

  if (pagePosts.length === 0) {
    grid.innerHTML = `
      <div class="no-posts">
        <i class="bi bi-search" aria-hidden="true"></i>
        <h3>Nenhum artigo encontrado</h3>
        <p>Tente ajustar sua busca ou filtro</p>
      </div>
    `;
    grid.removeAttribute('aria-busy');
    updateCount();
    return;
  }

  grid.innerHTML = pagePosts.map((post) => createPostCard(post)).join('');
  grid.removeAttribute('aria-busy');
  updateCount();
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    pagination.innerHTML = '';
    return;
  }

  pagination.style.display = 'flex';

  let html = '';

  if (currentPage > 1) {
    html += `<button class="page-btn" data-page="${currentPage - 1}" aria-label="Página anterior"><i class="bi bi-chevron-left"></i></button>`;
  }

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="page-ellipsis">…</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}" ${i === currentPage ? 'aria-current="page"' : ''}>${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  if (currentPage < totalPages) {
    html += `<button class="page-btn" data-page="${currentPage + 1}" aria-label="Próxima página"><i class="bi bi-chevron-right"></i></button>`;
  }

  pagination.innerHTML = html;

  pagination.querySelectorAll('.page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderPosts();
      renderPagination();
      document.getElementById('posts-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function updateCount() {
  const countEl = document.getElementById('posts-count');
  if (!countEl) return;
  const total = allPosts.length;
  const filtered = filteredPosts.length;
  countEl.textContent =
    filtered === total
      ? `${total} artigo${total !== 1 ? 's' : ''}`
      : `${filtered} de ${total} artigo${total !== 1 ? 's' : ''}`;
}

