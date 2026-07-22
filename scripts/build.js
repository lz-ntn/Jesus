import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const { window } = new JSDOM('');
const purify = DOMPurify(window);

const SITE_URL = 'https://jesus-7ykm.onrender.com';

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

function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function createLayout({ title, meta = '', activePage, content }) {
    const navLinks = [
        { href: '/', label: 'Início', page: 'home' },
        { href: '/posts.html', label: 'Artigos', page: 'posts' },
        { href: '/tags.html', label: 'Tags', page: 'tags' },
        { href: '/archive.html', label: 'Arquivo', page: 'archive' },
        { href: '/sobre.html', label: 'Sobre', page: 'sobre' },
    ];

    const navHtml = navLinks
        .map(l => `<a href="${l.href}" class="nav-link${l.page === activePage ? ' active' : ''}">${l.label}</a>`)
        .join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <script>try{var t=localStorage.getItem("jesus-theme");if(t)document.documentElement.setAttribute("data-theme",t);else if(matchMedia("(prefers-color-scheme:light)").matches)document.documentElement.setAttribute("data-theme","light");else document.documentElement.setAttribute("data-theme","dark")}catch(e){}</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Jesus, sem filtros</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  ${meta}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Literata:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Cinzel:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Literata:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Cinzel:wght@400;500;600;700&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <canvas id="particles-canvas" aria-hidden="true"></canvas>

  <header class="site-header" role="banner">
    <div class="container">
      <a href="/" class="site-brand" aria-label="Jesus, sem filtros - Início">
        <i class="bi bi-person-workspace" aria-hidden="true"></i>
        <span>Jesus, sem filtros</span>
      </a>
      <nav id="main-nav" class="main-nav" role="navigation" aria-label="Navegação principal">
        ${navHtml}
      </nav>
      <button class="theme-toggle" aria-label="Alternar entre tema claro e escuro" title="Alternar tema">
        <i class="bi bi-sun-fill" aria-hidden="true"></i>
        <i class="bi bi-moon-fill" aria-hidden="true"></i>
      </button>
      <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="main-nav">
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
    </div>
  </header>

  <main class="site-main" role="main">
    ${content}
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="footer-content">
        <p>&copy; Lz_ntn - ${new Date().getFullYear()} — Jesus, sem filtros</p>
        <nav class="footer-nav" aria-label="Links do rodapé">
          <a href="/feed.xml" target="_blank" rel="noopener"><i class="bi bi-rss" aria-hidden="true"></i> RSS</a>
          <a href="/sitemap.xml" target="_blank" rel="noopener"><i class="bi bi-diagram-3" aria-hidden="true"></i> Sitemap</a>
          <a href="https://github.com/lz-ntn/Jesus" target="_blank" rel="noopener"><i class="bi bi-github" aria-hidden="true"></i> GitHub</a>
        </nav>
      </div>
    </div>
  </footer>

  <button id="back-to-top" class="back-to-top" aria-label="Voltar ao topo">
    <i class="bi bi-chevron-up" aria-hidden="true"></i>
  </button>

  <script type="module" src="/js/main.js"></script>
</body>
</html>`;
}

function generatePostPage(post) {
    const meta = `
  <meta name="description" content="${escapeXml(post.excerpt)}">
  <meta property="og:title" content="${escapeXml(post.title)}">
  <meta property="og:description" content="${escapeXml(post.excerpt)}">
  <meta property="og:type" content="article">
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:tag" content="${post.tags.join(',')}">
  <link rel="canonical" href="${SITE_URL}/posts/${post.slug}.html">`;

    const tagsHtml = post.tags
        .map(tag => `<a href="/tags/${slugify(tag)}.html" class="tag">${tag}</a>`)
        .join('');

    const content = `
    <article class="post-page">
      <header class="post-header">
        <div class="post-meta">
          <time datetime="${post.date}">${formatDate(post.date)}</time>
          <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
        </div>
        <h1 class="post-title">${post.title}</h1>
        <div class="post-tags">${tagsHtml}</div>
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
            <i class="bi bi-link-45deg" aria-hidden="true"></i>
          </button>
          <button class="share-btn" data-action="twitter" aria-label="Compartilhar no Twitter">
            <i class="bi bi-twitter-x" aria-hidden="true"></i>
          </button>
          <button class="share-btn" data-action="whatsapp" aria-label="Compartilhar no WhatsApp">
            <i class="bi bi-whatsapp" aria-hidden="true"></i>
          </button>
        </div>
      </footer>
    </article>

    <nav class="post-nav" aria-label="Navegação entre posts">
      <a href="/posts.html" class="post-nav-link back-link">
        <i class="bi bi-arrow-left" aria-hidden="true"></i> Voltar aos artigos
      </a>
    </nav>`;

    return createLayout({ title: post.title, meta, activePage: 'posts', content });
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
        <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
        <div class="tags">
          ${post.tags.map(t => `<a href="/tags/${slugify(t)}.html" class="tag">${t}</a>`).join('')}
        </div>
      </footer>
    </article>
  `).join('');

    const content = `
    <header class="page-header"><h1>Tag: ${tag}</h1><p>${posts.length} artigo${posts.length !== 1 ? 's' : ''}</p></header>
    <div class="posts-grid">${postsHtml}</div>`;

    return createLayout({ title: `Tag: ${tag}`, meta: `<link rel="canonical" href="${SITE_URL}/tags/${slugify(tag)}.html">`, activePage: 'tags', content });
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

    const content = `
    <header class="page-header"><h1>Arquivo Completo</h1><p>${posts.length} artigos publicados</p></header>
    <div class="archive">${yearsHtml}</div>`;

    return createLayout({ title: 'Arquivo', activePage: 'archive', content });
}

function generateRSS(posts) {
    const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/posts/${post.slug}.html</link>
      <guid isPermaLink="true">${SITE_URL}/posts/${post.slug}.html</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <author>${post.author}</author>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Jesus, sem filtros</title>
    <link>${SITE_URL}</link>
    <description>Visão histórica e direta sobre Jesus de Nazaré — sem maquiagem religiosa, sem romantismo new age, sem cinismo barato.</description>
    <language>pt-BR</language>
    <lastBuildDate>${posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

function generateSitemap(posts, tagsMap) {
    const pages = [
        { url: '/', changefreq: 'weekly', priority: 1.0 },
        { url: '/posts.html', changefreq: 'daily', priority: 0.9 },
        { url: '/tags.html', changefreq: 'weekly', priority: 0.8 },
        { url: '/archive.html', changefreq: 'weekly', priority: 0.7 },
        { url: '/sobre.html', changefreq: 'monthly', priority: 0.6 },
    ];

    for (const post of posts) {
        pages.push({
            url: `/posts/${post.slug}.html`,
            changefreq: 'monthly',
            priority: 0.8,
            lastmod: post.date,
        });
    }

    for (const tag of tagsMap.keys()) {
        pages.push({
            url: `/tags/${slugify(tag)}.html`,
            changefreq: 'weekly',
            priority: 0.5,
        });
    }

    const urls = pages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function build() {
    const startTime = Date.now();

    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    ensureDir('dist');
    ensureDir('dist/posts');
    ensureDir('dist/tags');
    ensureDir('dist/data');

    const files = await glob('content/posts/**/*.md');
    const posts = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const { data, content: markdown } = matter(content);
        const html = purify.sanitize(marked.parse(markdown));
        const slug = data.slug || slugify(data.title);
        const date = data.date ? new Date(data.date) : new Date(fs.statSync(file).mtime);

        posts.push({
            slug,
            title: data.title,
            excerpt: data.excerpt || markdown.slice(0, 200).replace(/[#*_`]/g, '').trim() + '...',
            date: date.toISOString().split('T')[0],
            tags: data.tags || [],
            author: data.author || 'Lz_ntn',
            readingTime: Math.ceil(markdown.split(/\s+/).length / 200),
            html,
            markdown,
        });
    }

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const indexPosts = posts.map(({ html, markdown, ...rest }) => rest);
    const indexJson = JSON.stringify(indexPosts, null, 2);
    fs.writeFileSync('dist/data/posts-index.json', indexJson);
    ensureDir('src/data');
    fs.writeFileSync('src/data/posts-index.json', indexJson);
    console.log(`✓ Index: ${posts.length} posts`);

    for (const post of posts) {
        fs.writeFileSync(path.join('dist/posts', `${post.slug}.html`), generatePostPage(post));
    }
    console.log(`✓ Post pages: ${posts.length}`);

    const tagsMap = new Map();
    for (const post of posts) {
        for (const tag of post.tags) {
            if (!tagsMap.has(tag)) tagsMap.set(tag, []);
            tagsMap.get(tag).push(post);
        }
    }

    for (const [tag, tagPosts] of tagsMap) {
        fs.writeFileSync(path.join('dist/tags', `${slugify(tag)}.html`), generateTagPage(tag, tagPosts));
    }
    console.log(`✓ Tag pages: ${tagsMap.size}`);

    fs.writeFileSync('dist/feed.xml', generateRSS(posts));
    console.log('✓ RSS feed');

    fs.writeFileSync('dist/sitemap.xml', generateSitemap(posts, tagsMap));
    console.log('✓ Sitemap');

    const elapsed = Date.now() - startTime;
    console.log(`\nBuild concluído em ${elapsed}ms`);
}

build().catch(console.error);