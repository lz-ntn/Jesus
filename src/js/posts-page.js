let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const POSTS_PER_PAGE = 9;

export async function loadPostsPage() {
  await loadPostsIndex();
  setupSearch();
  setupSort();
  renderPosts();
  renderPagination();
}

async function loadPostsIndex() {
  try {
    const response = await fetch('/data/posts-index.json');
    if (response.ok) {
      allPosts = await response.json();
    }
  } catch (e) {
    console.warn('Posts index not loaded:', e);
    allPosts = [];
  }
  filteredPosts = [...allPosts];
  updateCount();
}

function setupSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  
  if (!input || !results) return;
  
  let debounceTimer;
  
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        results.classList.remove('active');
        filteredPosts = [...allPosts];
        currentPage = 1;
        renderPosts();
        renderPagination();
        return;
      }
      
      filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
      
      currentPage = 1;
      renderPosts();
      renderPagination();
      
      if (query.length >= 2) {
        showSearchResults(query, results);
      } else {
        results.classList.remove('active');
      }
    }, 150);
  });
  
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      showSearchResults(input.value.trim().toLowerCase(), results);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      results.classList.remove('active');
    }
  });
}

function showSearchResults(query, container) {
  const matches = allPosts
    .filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    )
    .slice(0, 5);
  
  if (matches.length === 0) {
    container.innerHTML = '<div class="no-results">Nenhum resultado encontrado</div>';
  } else {
    container.innerHTML = matches.map(post => `
      <a href="/posts/${post.slug}.html" class="search-result-item" role="option">
        <h4>${highlightMatch(post.title, query)}</h4>
        <p>${highlightMatch(post.excerpt, query)}</p>
        <div class="result-meta">
          <time>${formatDate(post.date)}</time>
          <span>${post.readingTime} min</span>
        </div>
      </a>
    `).join('');
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
  
  select.addEventListener('change', (e) => {
    sortPosts(e.target.value);
    currentPage = 1;
    renderPosts();
    renderPagination();
  });
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
  const end = start + POSTS_PER_PAGE;
  const pagePosts = filteredPosts.slice(start, end);
  
  if (pagePosts.length === 0) {
    grid.innerHTML = `
      <div class="no-posts">
        <i class="bi bi-search"></i>
        <h3>Nenhum artigo encontrado</h3>
        <p>Tente ajustar sua busca ou filtro</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = pagePosts.map(post => `
    <article class="post-card" role="listitem">
      <header>
        <time datetime="${post.date}">${formatDate(post.date)}</time>
        <h2><a href="/posts/${post.slug}.html">${escapeHtml(post.title)}</a></h2>
      </header>
      <p class="excerpt">${escapeHtml(post.excerpt)}</p>
      <footer>
        <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
        <div class="tags">
          ${post.tags.map(tag => `<a href="/tags/${slugify(tag)}.html" class="tag">${escapeHtml(tag)}</a>`).join('')}
        </div>
      </footer>
    </article>
  `).join('');
  
  updateCount();
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  
  if (totalPages <= 1) {
    pagination.style.display = 'none';
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
  
  pagination.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderPosts();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function updateCount() {
  const countEl = document.getElementById('posts-count');
  if (countEl) {
    const total = allPosts.length;
    const filtered = filteredPosts.length;
    if (filtered === total) {
      countEl.textContent = `${total} artigo${total !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = `${filtered} de ${total} artigo${total !== 1 ? 's' : ''}`;
    }
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}