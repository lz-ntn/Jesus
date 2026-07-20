import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const distDir = resolve('dist');
const manifestPath = resolve('dist/.vite/manifest.json');

if (!readFileSync(manifestPath, 'utf-8')) {
  console.warn('⚠ Vite manifest not found, skipping postbuild');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

const mainPolyfill = manifest['_main-BsW5INhO.js'];
const mainApp = manifest['_main-ikLxAeY6.js'];

if (!mainPolyfill || !mainApp) {
  console.warn('⚠ Main chunks not found in manifest');
  process.exit(0);
}

const cssPath = mainPolyfill.css?.[0];
const polyfillPath = mainPolyfill.file;
const appPath = mainApp.file;

const scriptTags = [
  `<script type="module" crossorigin src="/${polyfillPath}"></script>`,
  `<script type="module" crossorigin src="/${appPath}"></script>`,
].join('\n  ');

const cssTag = cssPath ? `<link rel="stylesheet" crossorigin href="/${cssPath}">` : '';

function patchHtml(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  let changed = false;

  if (cssTag && html.includes('/css/main.css')) {
    html = html.replace('<link rel="stylesheet" href="/css/main.css">', cssTag);
    changed = true;
  }

  const jsPattern = /<script type="module" src="\/js\/main\.js"><\/script>/;
  if (jsPattern.test(html)) {
    html = html.replace(jsPattern, scriptTags);
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, html);
    return true;
  }
  return false;
}

let count = 0;

const postFiles = readdirSync(join(distDir, 'posts')).filter(f => f.endsWith('.html'));
for (const file of postFiles) {
  if (patchHtml(join(distDir, 'posts', file))) count++;
}

const tagFiles = readdirSync(join(distDir, 'tags')).filter(f => f.endsWith('.html'));
for (const file of tagFiles) {
  if (patchHtml(join(distDir, 'tags', file))) count++;
}

console.log(`✓ Patched ${count} HTML files with Vite asset paths`);
