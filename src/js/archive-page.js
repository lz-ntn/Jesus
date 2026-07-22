import { getPostsIndex, formatDate, escapeHtml } from './posts-data.js';

export async function loadArchivePage() {
  const allPosts = await getPostsIndex();
  renderArchive(allPosts);
}

function renderArchive(allPosts) {
  const archive = document.getElementById('archive');
  const countEl = document.getElementById('archive-count');
  if (!archive) return;

  const byYear = {};
  allPosts.forEach((post) => {
    const year = post.date.split('-')[0];
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  });

  const years = Object.keys(byYear).sort((a, b) => b - a);

  if (countEl) {
    countEl.textContent = `${allPosts.length} artigo${allPosts.length !== 1 ? 's' : ''} em ${years.length} ano${years.length !== 1 ? 's' : ''}`;
  }

  archive.innerHTML = years
    .map(
      (year) => `
    <section class="archive-year" role="listitem">
      <h2>${year}</h2>
      <ul class="archive-list" role="list">
        ${byYear[year]
          .map(
            (post) => `
          <li>
            <time datetime="${escapeHtml(post.date)}">${formatDate(post.date, { day: '2-digit', month: 'short', year: 'numeric' })}</time>
            <a href="/posts/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a>
            <span class="reading-time">${post.readingTime} min</span>
          </li>
        `
          )
          .join('')}
      </ul>
    </section>
  `
    )
    .join('');
}
