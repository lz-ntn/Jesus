import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const { window } = new JSDOM('');
const purify = DOMPurify(window);

async function generateRSS() {
  const files = await glob('content/posts/**/*.md');
  const posts = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);
    posts.push({
      title: data.title,
      slug: data.slug || slugify(data.title),
      date: data.date ? new Date(data.date) : new Date(fs.statSync(file).mtime),
      excerpt: data.excerpt || '',
      author: data.author || 'Lz_ntn',
    });
  }
  
  posts.sort((a, b) => b.date - a.date);
  
  const siteUrl = 'https://jesus-sem-filtros.com';
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Jesus, sem filtros</title>
    <link>${siteUrl}</link>
    <description>Visão histórica e direta sobre Jesus de Nazaré — sem maquiagem religiosa, sem romantismo new age, sem cinismo barato.</description>
    <language>pt-BR</language>
    <lastBuildDate>${posts[0].date.toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${post.slug}.html</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.slug}.html</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <author>${post.author}</author>
      <pubDate>${post.date.toUTCString()}</pubDate>
    </item>
    `).join('')}
  </channel>
</rss>`;
  
  fs.writeFileSync('dist/feed.xml', rss);
  console.log('✓ Generated feed.xml');
}

async function generateSitemap() {
  const files = await glob('content/posts/**/*.md');
  const pages = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/posts.html', changefreq: 'daily', priority: 0.9 },
    { url: '/tags.html', changefreq: 'weekly', priority: 0.8 },
    { url: '/archive.html', changefreq: 'weekly', priority: 0.7 },
    { url: '/sobre.html', changefreq: 'monthly', priority: 0.6 },
  ];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);
    const slug = data.slug || slugify(data.title);
    pages.push({
      url: `/posts/${slug}.html`,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date(fs.statSync(file).mtime).toISOString().split('T')[0],
    });
  }
  
  // Add tag pages
  const tagFiles = await glob('dist/tags/*.html');
  for (const file of tagFiles) {
    const name = path.basename(file, '.html');
    if (name !== 'index') {
      pages.push({
        url: `/tags/${name}.html`,
        changefreq: 'weekly',
        priority: 0.5,
      });
    }
  }
  
  const siteUrl = 'https://jesus-sem-filtros.com';
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  fs.writeFileSync('dist/sitemap.xml', sitemap);
  console.log('✓ Generated sitemap.xml');
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

generateRSS().then(() => generateSitemap()).catch(console.error);