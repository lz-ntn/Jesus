import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const distDir = resolve('dist');
const manifestPath = resolve('dist/.vite/manifest.json');
const indexPath = resolve('dist/data/posts-index.json');

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr, opts = { day: '2-digit', month: 'long', year: 'numeric' }) {
  return new Date(dateStr).toLocaleDateString('pt-BR', opts);
}

function createPostCard(post, { heading = 'h2', maxTags = 3 } = {}) {
  const tags = (post.tags || [])
    .slice(0, maxTags)
    .map((tag) => `<a href="/tags/${slugify(tag)}.html" class="tag">${escapeHtml(tag)}</a>`)
    .join('');

  return `
    <article class="post-card" role="listitem">
      <header>
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
        <${heading}><a href="/posts/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a></${heading}>
      </header>
      <p class="excerpt">${escapeHtml(post.excerpt)}</p>
      <footer>
        <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
        <div class="tags">${tags}</div>
      </footer>
    </article>`;
}

function injectBetween(html, startId, innerHtml) {
  const openRe = new RegExp(`<([a-zA-Z][\\w-]*)([^>]*\\bid=["']${startId}["'][^>]*)>`, 'i');
  const match = openRe.exec(html);
  if (!match) return { html, changed: false };

  const tag = match[1].toLowerCase();
  const openTag = match[0];
  const start = match.index;
  let i = start + openTag.length;
  let depth = 1;

  while (i < html.length && depth > 0) {
    const nextLt = html.indexOf('<', i);
    if (nextLt === -1) break;

    const slice = html.slice(nextLt);
    const closeMatch = slice.match(new RegExp(`^</${tag}\\s*>`, 'i'));
    const openMatch = slice.match(new RegExp(`^<${tag}\\b[^>]*>`, 'i'));
    const openSelf = slice.match(new RegExp(`^<${tag}\\b[^>]*/>`, 'i'));

    if (openSelf) {
      i = nextLt + openSelf[0].length;
      continue;
    }
    if (openMatch) {
      depth += 1;
      i = nextLt + openMatch[0].length;
      continue;
    }
    if (closeMatch) {
      depth -= 1;
      if (depth === 0) {
        const end = nextLt + closeMatch[0].length;
        const cleanedOpen = openTag.replace(/\saria-busy=["']true["']/i, '');
        const next = html.slice(0, start) + cleanedOpen + innerHtml + `</${tag}>` + html.slice(end);
        return { html: next, changed: true };
      }
      i = nextLt + closeMatch[0].length;
      continue;
    }
    i = nextLt + 1;
  }

  return { html, changed: false };
}

function injectStaticContent(html, posts) {
  let changed = false;
  let next = html;

  if (next.includes('id="featured-posts"')) {
    const featured = posts.slice(0, 6).map((p) => createPostCard(p)).join('');
    const result = injectBetween(next, 'featured-posts', featured || '<p class="no-posts">Nenhum artigo publicado ainda.</p>');
    next = result.html;
    changed = changed || result.changed;
  }

  if (next.includes('id="posts-grid"') && next.includes('id="sort-select"')) {
    const page = posts.slice(0, 9).map((p) => createPostCard(p)).join('');
    const result = injectBetween(next, 'posts-grid', page || '<p class="no-posts">Nenhum artigo publicado ainda.</p>');
    next = result.html;
    changed = changed || result.changed;

    const count = `${posts.length} artigo${posts.length !== 1 ? 's' : ''}`;
    if (next.includes('id="posts-count"')) {
      next = next.replace(
        /(<span[^>]*id=["']posts-count["'][^>]*>)([\s\S]*?)(<\/span>)/i,
        `$1${count}$3`
      );
      changed = true;
    }
  }

  if (next.includes('id="tag-cloud"')) {
    const tagsMap = new Map();
    posts.forEach((post) => {
      (post.tags || []).forEach((tag) => {
        if (!tagsMap.has(tag)) tagsMap.set(tag, []);
        tagsMap.get(tag).push(post);
      });
    });
    const sorted = [...tagsMap.entries()].sort((a, b) => b[1].length - a[1].length);
    const cloud = sorted
      .map(([tag, list]) => {
        const size = Math.min(1 + list.length * 0.15, 2.5);
        return `<a href="#tag-${slugify(tag)}" class="tag-cloud-item" style="--size: ${size}rem" role="listitem">${escapeHtml(tag)} <span class="tag-count">(${list.length})</span></a>`;
      })
      .join('');
    const sections = sorted
      .map(
        ([tag, list]) => `
      <section class="tag-section" id="tag-${slugify(tag)}" aria-labelledby="tag-${slugify(tag)}-title">
        <h2 id="tag-${slugify(tag)}-title"><a href="/tags/${slugify(tag)}.html">${escapeHtml(tag)}</a> <span class="tag-count">(${list.length})</span></h2>
        <div class="posts-grid">${list.map((p) => createPostCard(p, { heading: 'h3', maxTags: 2 })).join('')}</div>
      </section>`
      )
      .join('');

    let r = injectBetween(next, 'tag-cloud', cloud);
    next = r.html;
    changed = changed || r.changed;

    r = injectBetween(next, 'tag-sections', sections);
    next = r.html;
    changed = changed || r.changed;

    const summary = `${sorted.length} tópico${sorted.length !== 1 ? 's' : ''} em ${posts.length} artigo${posts.length !== 1 ? 's' : ''}`;
    next = next.replace(
      /(<p[^>]*id=["']tags-count["'][^>]*>)([\s\S]*?)(<\/p>)/i,
      `$1${summary}$3`
    );
  }

  if (next.includes('id="archive"')) {
    const byYear = {};
    posts.forEach((post) => {
      const year = post.date.split('-')[0];
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(post);
    });
    const years = Object.keys(byYear).sort((a, b) => b - a);
    const archiveHtml = years
      .map(
        (year) => `
      <section class="archive-year" role="listitem">
        <h2>${year}</h2>
        <ul class="archive-list" role="list">
          ${byYear[year]
            .map(
              (post) => `<li>
            <time datetime="${escapeHtml(post.date)}">${formatDate(post.date, { day: '2-digit', month: 'short', year: 'numeric' })}</time>
            <a href="/posts/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a>
            <span class="reading-time">${post.readingTime} min</span>
          </li>`
            )
            .join('')}
        </ul>
      </section>`
      )
      .join('');

    const r = injectBetween(next, 'archive', archiveHtml);
    next = r.html;
    changed = changed || r.changed;

    const summary = `${posts.length} artigo${posts.length !== 1 ? 's' : ''} em ${years.length} ano${years.length !== 1 ? 's' : ''}`;
    next = next.replace(
      /(<p[^>]*id=["']archive-count["'][^>]*>)([\s\S]*?)(<\/p>)/i,
      `$1${summary}$3`
    );
  }

  return { html: next, changed };
}

function patchAssets(html, cssTag, scriptTags) {
  let changed = false;
  let next = html;

  if (cssTag && next.includes('href="/css/main.css"')) {
    next = next.replace(/<link rel="stylesheet" href="\/css\/main\.css">/, cssTag);
    changed = true;
  }

  if (next.includes('src="/js/main.js"')) {
    next = next.replace(/<script type="module" src="\/js\/main\.js"><\/script>/, scriptTags);
    changed = true;
  }

  return { html: next, changed };
}

function processFile(filePath, posts, cssTag, scriptTags) {
  let html = readFileSync(filePath, 'utf-8');
  let changed = false;

  const assets = patchAssets(html, cssTag, scriptTags);
  html = assets.html;
  changed = changed || assets.changed;

  if (posts) {
    const content = injectStaticContent(html, posts);
    html = content.html;
    changed = changed || content.changed;
  }

  if (changed) writeFileSync(filePath, html);
  return changed;
}

// --- main ---
if (!existsSync(manifestPath)) {
  console.warn('⚠ Manifest not found, skipping postbuild patch');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const entries = Object.values(manifest);
const appChunk =
  entries.find((v) => v.name === 'main' && v.file?.endsWith('.js')) ||
  entries.find((v) => v.isEntry && v.file?.endsWith('.js')) ||
  entries.find((v) => v.file?.endsWith('.js') && Array.isArray(v.css));

if (!appChunk) {
  console.warn('⚠ Could not find main JS chunk in manifest');
  process.exit(0);
}

const cssPath = appChunk.css?.[0] || entries.find((v) => v.file?.endsWith('.css'))?.file;
const appPath = appChunk.file;
const scriptTags = `<script type="module" crossorigin src="/${appPath}"></script>`;
const cssTag = cssPath ? `<link rel="stylesheet" crossorigin href="/${cssPath}">` : '';

const posts = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf-8')) : [];

let count = 0;

for (const dir of ['posts', 'tags']) {
  const dirPath = join(distDir, dir);
  if (!existsSync(dirPath)) continue;
  for (const file of readdirSync(dirPath).filter((f) => f.endsWith('.html'))) {
    if (processFile(join(dirPath, file), null, cssTag, scriptTags)) count++;
  }
}

for (const file of readdirSync(distDir).filter((f) => f.endsWith('.html'))) {
  if (processFile(join(distDir, file), posts, cssTag, scriptTags)) count++;
}

console.log(`✓ Patched ${count} HTML files`);
console.log(`  JS: /${appPath}`);
if (cssPath) console.log(`  CSS: /${cssPath}`);
if (posts.length) console.log(`  Static content: ${posts.length} posts`);
