import { getPostsIndex, createPostCard, slugify, escapeHtml } from './posts-data.js';

export async function loadTagsPage() {
  const allPosts = await getPostsIndex();
  const allTags = buildTagIndex(allPosts);
  renderTagCloud(allTags, allPosts.length);
  renderTagSections(allTags);

  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }
}

function buildTagIndex(allPosts) {
  const allTags = new Map();
  allPosts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      if (!allTags.has(tag)) allTags.set(tag, []);
      allTags.get(tag).push(post);
    });
  });
  return allTags;
}

function renderTagCloud(allTags, postsCount) {
  const cloud = document.getElementById('tag-cloud');
  const countEl = document.getElementById('tags-count');
  if (!cloud) return;

  const sortedTags = Array.from(allTags.entries()).sort((a, b) => b[1].length - a[1].length);

  if (countEl) {
    countEl.textContent = `${sortedTags.length} tópico${sortedTags.length !== 1 ? 's' : ''} em ${postsCount} artigo${postsCount !== 1 ? 's' : ''}`;
  }

  cloud.innerHTML = sortedTags
    .map(([tag, posts]) => {
      const size = Math.min(1 + posts.length * 0.15, 2.5);
      return `
      <a href="#tag-${slugify(tag)}" class="tag-cloud-item" style="--size: ${size}rem" role="listitem">
        ${escapeHtml(tag)}
        <span class="tag-count">(${posts.length})</span>
      </a>
    `;
    })
    .join('');
}

function renderTagSections(allTags) {
  const sections = document.getElementById('tag-sections');
  if (!sections) return;

  const sortedTags = Array.from(allTags.entries()).sort((a, b) => b[1].length - a[1].length);

  sections.innerHTML = sortedTags
    .map(
      ([tag, posts]) => `
    <section class="tag-section" id="tag-${slugify(tag)}" aria-labelledby="tag-${slugify(tag)}-title">
      <h2 id="tag-${slugify(tag)}-title">
        <a href="/tags/${slugify(tag)}.html">${escapeHtml(tag)}</a>
        <span class="tag-count">(${posts.length})</span>
      </h2>
      <div class="posts-grid">
        ${posts.map((post) => createPostCard(post, { heading: 'h3', maxTags: 2 })).join('')}
      </div>
    </section>
  `
    )
    .join('');
}
