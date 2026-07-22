import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const distDir = resolve('dist');
const manifestPath = resolve('dist/.vite/manifest.json');

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

function patchHtml(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  let changed = false;

  if (cssTag && html.includes('href="/css/main.css"')) {
    html = html.replace(/<link rel="stylesheet" href="\/css\/main\.css">/, cssTag);
    changed = true;
  }

  if (html.includes('src="/js/main.js"')) {
    html = html.replace(/<script type="module" src="\/js\/main\.js"><\/script>/, scriptTags);
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, html);
    return true;
  }
  return false;
}

let count = 0;

for (const dir of ['posts', 'tags']) {
  const dirPath = join(distDir, dir);
  if (!existsSync(dirPath)) continue;
  const files = readdirSync(dirPath).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    if (patchHtml(join(dirPath, file))) count++;
  }
}

const rootFiles = readdirSync(distDir).filter((f) => f.endsWith('.html'));
for (const file of rootFiles) {
  if (patchHtml(join(distDir, file))) count++;
}

console.log(`✓ Patched ${count} HTML files with Vite asset paths`);
console.log(`  JS: /${appPath}`);
if (cssPath) console.log(`  CSS: /${cssPath}`);
