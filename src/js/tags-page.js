let allPosts = [];
let allTags = new Map();

export async function loadTagsPage() {
  await loadPostsIndex();
  buildTagIndex();
  renderTagCloud();
  renderTagSections();
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
}

function buildTagIndex() {
  allTags.clear();
  
  allPosts.forEach(post => {
    post.tags.forEach(tag => {
      if (!allTags.has(tag)) {
        allTags.set(tag, []);
      }
      allTags.get(tag).push(post);
    });
  });
}

function renderTagCloud() {
  const cloud = document.getElementById('tag-cloud');
  const countEl = document.getElementById('tags-count');
  
  if (!cloud) return;
  
  const sortedTags = Array.from(allTags.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  if (countEl) {
    countEl.textContent = `${sortedTags.length} tópico${sortedTags.length !== 1 ? 's' : ''} em ${allPosts.length} artigo${allPosts.length !== 1 ? 's' : ''}`;
  }
  
  cloud.innerHTML = sortedTags.map(([tag, posts]) => {
    const size = Math.min(1 + posts.length * 0.15, 2.5);
    return `
      <a href="#tag-${slugify(tag)}" class="tag-cloud-item" style="--size: ${size}rem" role="listitem">
        ${escapeHtml(tag)}
        <span class="tag-count">(${posts.length})</span>
      </a>
    `;
  }).join('');
}

function renderTagSections() {
  const sections = document.getElementById('tag-sections');
  if (!sections) return;
  
  const sortedTags = Array.from(allTags.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sections.innerHTML = sortedTags.map(([tag, posts]) => `
    <section class="tag-section" id="tag-${slugify(tag)}" aria-labelledby="tag-${slugify(tag)}-title">
      <h2 id="tag-${slugify(tag)}-title">${escapeHtml(tag)} <span class="tag-count">(${posts.length})</span></h2>
      <div class="posts-grid">
        ${posts.map(post => `
          <article class="post-card">
            <header>
              <time datetime="${post.date}">${formatDate(post.date)}</time>
              <h3><a href="/posts/${post.slug}.html">${escapeHtml(post.title)}</a></h3>
            </header>
            <p class="excerpt">${escapeHtml(post.excerpt)}</p>
            <footer>
              <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
              <div class="tags">
                ${post.tags.map(t => `<a href="#tag-${slugify(t)}" class="tag">${escapeHtml(t)}</a>`).join('')}
              </div>
            </footer>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}