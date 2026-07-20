import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const distDir = resolve('dist');
const manifestPath = resolve('dist/.vite/manifest.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

const chunks = Object.entries(manifest).filter(([k]) => k.startsWith('_main-'));

const polyfillChunk = chunks.find(([, v]) => v.css)?.[1];
const appChunk = chunks.find(([, v]) => !v.css && v.name === 'main')?.[1];

if (!polyfillChunk || !appChunk) {
  console.warn('⚠ Could not find main chunks in manifest');
  process.exit(0);
}

const cssPath = polyfillChunk.css?.[0];
const polyfillPath = polyfillChunk.file;
const appPath = appChunk.file;

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

for (const dir of ['posts', 'tags']) {
  const dirPath = join(distDir, dir);
  if (!existsSync(dirPath)) continue;
  const files = readdirSync(dirPath).filter(f => f.endsWith('.html'));
  for (const file of files) {
    if (patchHtml(join(dirPath, file))) count++;
  }
}

const rootFiles = readdirSync(distDir).filter(f => f.endsWith('.html'));
for (const file of rootFiles) {
  if (patchHtml(join(distDir, file))) count++;
}

console.log(`✓ Patched ${count} HTML files with Vite asset paths`);
