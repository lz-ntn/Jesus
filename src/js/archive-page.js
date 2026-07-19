let allPosts = [];

export async function loadArchivePage() {
  await loadPostsIndex();
  renderArchive();
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

function renderArchive() {
  const archive = document.getElementById('archive');
  const countEl = document.getElementById('archive-count');
  
  if (!archive) return;
  
  const byYear = {};
  allPosts.forEach(post => {
    const year = post.date.split('-')[0];
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  });
  
  const years = Object.keys(byYear).sort((a, b) => b - a);
  
  if (countEl) {
    countEl.textContent = `${allPosts.length} artigo${allPosts.length !== 1 ? 's' : ''} em ${years.length} ano${years.length !== 1 ? 's' : ''}`;
  }
  
  archive.innerHTML = years.map(year => `
    <section class="archive-year" role="listitem">
      <h2>${year}</h2>
      <ul class="archive-list" role="list">
        ${byYear[year].map(post => `
          <li>
            <time datetime="${post.date}">${formatDate(post.date)}</time>
            <a href="/posts/${post.slug}.html">${escapeHtml(post.title)}</a>
            <span class="reading-time">${post.readingTime} min</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}