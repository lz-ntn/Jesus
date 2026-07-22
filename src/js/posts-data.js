const CACHE_KEY = 'jesus-posts-index-v1';
const CACHE_TTL_MS = 1000 * 60 * 30;

let memoryCache = null;
let inflight = null;

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSessionCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* quota / private mode */
  }
}

export async function getPostsIndex() {
  if (memoryCache) return memoryCache;

  const cached = readSessionCache();
  if (cached) {
    memoryCache = cached;
    return cached;
  }

  if (inflight) return inflight;

  inflight = fetch('/data/posts-index.json', { credentials: 'same-origin' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      memoryCache = Array.isArray(data) ? data : [];
      writeSessionCache(memoryCache);
      return memoryCache;
    })
    .catch((err) => {
      console.warn('Falha ao carregar índice de posts:', err);
      return [];
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function formatDate(dateStr, opts = { day: '2-digit', month: 'long', year: 'numeric' }) {
  return new Date(dateStr).toLocaleDateString('pt-BR', opts);
}

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

export function createPostCard(post, { heading = 'h2', maxTags = 3 } = {}) {
  const date = formatDate(post.date);
  const tags = (post.tags || [])
    .slice(0, maxTags)
    .map((tag) => `<a href="/tags/${slugify(tag)}.html" class="tag">${escapeHtml(tag)}</a>`)
    .join('');

  return `
    <article class="post-card" role="listitem">
      <header>
        <time datetime="${escapeHtml(post.date)}">${date}</time>
        <${heading}><a href="/posts/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a></${heading}>
      </header>
      <p class="excerpt">${escapeHtml(post.excerpt)}</p>
      <footer>
        <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
        <div class="tags">${tags}</div>
      </footer>
    </article>
  `;
}
