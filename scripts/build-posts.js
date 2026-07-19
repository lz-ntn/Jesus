import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const { window } = new JSDOM('');
const purify = DOMPurify(window);

const CONTENT_DIR = 'content/posts';
const OUTPUT_DIR = 'src/pages/posts';
const INDEX_FILE = 'src/data/posts-index.json';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function buildPosts() {
  ensureDir(OUTPUT_DIR);
  ensureDir('src/data');

  const files = await glob(`${CONTENT_DIR}/**/*.md`);
  const posts = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const { data, content: markdown } = matter(content);
    
    const html = purify.sanitize(marked.parse(markdown));
    
    const slug = data.slug || slugify(data.title);
    const date = data.date ? new Date(data.date) : new Date(fs.statSync(file).mtime);
    
    const post = {
      slug,
      title: data.title,
      excerpt: data.excerpt || markdown.slice(0, 200).replace(/[#*_`]/g, '').trim() + '...',
      date: date.toISOString().split('T')[0],
      tags: data.tags || [],
      author: data.author || 'Lz_ntn',
      readingTime: Math.ceil(markdown.split(/\s+/).length / 200),
      html,
      markdown,
    };
    
    posts.push(post);
    
    const postHtml = generatePostPage(post);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), postHtml);
    console.log(`✓ Generated: ${slug}.html`);
  }
  
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  fs.writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2));
  console.log(`✓ Generated index with ${posts.length} posts`);
  
  generateTagPages(posts);
  generateArchivePage(posts);
}

function generatePostPage(post) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} | Jesus, sem filtros</title>
  <meta name="description" content="${post.excerpt}">
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.excerpt}">
  <meta property="og:type" content="article">
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:tag" content="${post.tags.join(',')}">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="canonical" href="/posts/${post.slug}.html">
</head>
<body>
  <canvas id="particles-canvas"></canvas>
  
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-brand" aria-label="Início">
        <i class="bi bi-person-workspace"></i>
        <span>Jesus, sem filtros</span>
      </a>
      <nav class="main-nav" aria-label="Navegação principal">
        <a href="/" class="nav-link">Início</a>
        <a href="/posts.html" class="nav-link active">Artigos</a>
        <a href="/tags.html" class="nav-link">Tags</a>
        <a href="/sobre.html" class="nav-link">Sobre</a>
      </nav>
      <button class="theme-toggle" aria-label="Alternar tema" title="Alternar tema">
        <i class="bi bi-sun-fill"></i>
        <i class="bi bi-moon-fill"></i>
      </button>
    </div>
  </header>

  <main class="site-main">
    <article class="post-page">
      <header class="post-header">
        <div class="post-meta">
          <time datetime="${post.date}">${formatDate(post.date)}</time>
          <span class="reading-time"><i class="bi bi-clock"></i> ${post.readingTime} min</span>
        </div>
        <h1 class="post-title">${post.title}</h1>
        <div class="post-tags">
          ${post.tags.map(tag => `<a href="/tags.html#${tag}" class="tag">${tag}</a>`).join('')}
        </div>
      </header>
      
      <div class="post-content" id="post-content">
        ${post.html}
      </div>
      
      <footer class="post-footer">
        <div class="post-author">
          <span>Por ${post.author}</span>
        </div>
        <div class="post-share">
          <button class="share-btn" data-action="copy" aria-label="Copiar link">
            <i class="bi bi-link-45deg"></i>
          </button>
          <button class="share-btn" data-action="twitter" aria-label="Compartilhar no Twitter">
            <i class="bi bi-twitter-x"></i>
          </button>
          <button class="share-btn" data-action="whatsapp" aria-label="Compartilhar no WhatsApp">
            <i class="bi bi-whatsapp"></i>
          </button>
        </div>
      </footer>
    </article>
    
    <nav class="post-nav" aria-label="Navegação entre posts">
      <a href="/posts.html" class="post-nav-link back-link">
        <i class="bi bi-arrow-left"></i> Voltar aos artigos
      </a>
    </nav>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; Lz_ntn - ${new Date().getFullYear()}</p>
    </div>
  </footer>

  <script type="module" src="/js/main.js"></script>
</body>
</html>`;
}

function generateTagPages(posts) {
  const tags = new Map();
  
  posts.forEach(post => {
    post.tags.forEach(tag => {
      if (!tags.has(tag)) tags.set(tag, []);
      tags.get(tag).push(post);
    });
  });
  
  const tagDir = 'src/pages/tags';
  ensureDir(tagDir);
  
  tags.forEach((tagPosts, tag) => {
    const slug = slugify(tag);
    const html = generateTagPage(tag, tagPosts);
    fs.writeFileSync(path.join(tagDir, `${slug}.html`), html);
  });
  
  const allTagsHtml = generateAllTagsPage(tags);
  fs.writeFileSync(path.join(tagDir, 'index.html'), allTagsHtml);
}

function generateTagPage(tag, posts) {
  const postsHtml = posts.map(post => `
    <article class="post-card">
      <header>
        <time datetime="${post.date}">${formatDate(post.date)}</time>
        <h2><a href="/posts/${post.slug}.html">${post.title}</a></h2>
      </header>
      <p class="excerpt">${post.excerpt}</p>
      <footer>
        <span class="reading-time"><i class="bi bi-clock"></i> ${post.readingTime} min</span>
        <div class="tags">
          ${post.tags.map(t => `<a href="/tags/${slugify(t)}.html" class="tag">${t}</a>`).join('')}
        </div>
      </footer>
    </article>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tag: ${tag} | Jesus, sem filtros</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <canvas id="particles-canvas"></canvas>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-brand"><i class="bi bi-person-workspace"></i><span>Jesus, sem filtros</span></a>
      <nav class="main-nav"><a href="/" class="nav-link">Início</a><a href="/posts.html" class="nav-link active">Artigos</a><a href="/tags.html" class="nav-link">Tags</a><a href="/sobre.html" class="nav-link">Sobre</a></nav>
      <button class="theme-toggle" aria-label="Alternar tema"><i class="bi bi-sun-fill"></i><i class="bi bi-moon-fill"></i></button>
    </div>
  </header>
  <main class="site-main">
    <header class="page-header"><h1>Tag: ${tag}</h1><p>${posts.length} artigo${posts.length !== 1 ? 's' : ''}</p></header>
    <div class="posts-grid">${postsHtml}</div>
  </main>
  <footer class="site-footer"><div class="container"><p>&copy; Lz_ntn - ${new Date().getFullYear()}</p></div></footer>
  <script type="module" src="/js/main.js"></script>
</body>
</html>`;
}

function generateAllTagsPage(tagsMap) {
  const tagsHtml = Array.from(tagsMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, posts]) => `
      <a href="/tags/${slugify(tag)}.html" class="tag-cloud-item" style="--size: ${Math.min(1 + posts.length * 0.3, 3)}rem">
        ${tag} <span class="tag-count">(${posts.length})</span>
      </a>
    `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todas as tags | Jesus, sem filtros</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <canvas id="particles-canvas"></canvas>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-brand"><i class="bi bi-person-workspace"></i><span>Jesus, sem filtros</span></a>
      <nav class="main-nav"><a href="/" class="nav-link">Início</a><a href="/posts.html" class="nav-link active">Artigos</a><a href="/tags.html" class="nav-link">Tags</a><a href="/sobre.html" class="nav-link">Sobre</a></nav>
      <button class="theme-toggle" aria-label="Alternar tema"><i class="bi bi-sun-fill"></i><i class="bi bi-moon-fill"></i></button>
    </div>
  </header>
  <main class="site-main">
    <header class="page-header"><h1>Todas as Tags</h1><p>${tagsMap.size} tópicos abordados</p></header>
    <div class="tag-cloud">${tagsHtml}</div>
  </main>
  <footer class="site-footer"><div class="container"><p>&copy; Lz_ntn - ${new Date().getFullYear()}</p></div></footer>
  <script type="module" src="/js/main.js"></script>
</body>
</html>`;
}

function generateArchivePage(posts) {
  const byYear = {};
  posts.forEach(post => {
    const year = post.date.split('-')[0];
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  });

  const yearsHtml = Object.entries(byYear)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, yearPosts]) => `
      <section class="archive-year">
        <h2>${year}</h2>
        <ul class="archive-list">
          ${yearPosts.map(post => `
            <li>
              <time datetime="${post.date}">${formatDate(post.date)}</time>
              <a href="/posts/${post.slug}.html">${post.title}</a>
              <span class="reading-time">${post.readingTime} min</span>
            </li>
          `).join('')}
        </ul>
      </section>
    `).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arquivo | Jesus, sem filtros</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <canvas id="particles-canvas"></canvas>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-brand"><i class="bi bi-person-workspace"></i><span>Jesus, sem filtros</span></a>
      <nav class="main-nav"><a href="/" class="nav-link">Início</a><a href="/posts.html" class="nav-link active">Artigos</a><a href="/tags.html" class="nav-link">Tags</a><a href="/sobre.html" class="nav-link">Sobre</a></nav>
      <button class="theme-toggle" aria-label="Alternar tema"><i class="bi bi-sun-fill"></i><i class="bi bi-moon-fill"></i></button>
    </div>
  </header>
  <main class="site-main">
    <header class="page-header"><h1>Arquivo Completo</h1><p>${posts.length} artigos publicados</p></header>
    <div class="archive">${yearsHtml}</div>
  </main>
  <footer class="site-footer"><div class="container"><p>&copy; Lz_ntn - ${new Date().getFullYear()}</p></div></footer>
  <script type="module" src="/js/main.js"></script>
</body></html>`;

  fs.writeFileSync('src/pages/archive.html', html);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

buildPosts().catch(console.error);