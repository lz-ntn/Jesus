import { readFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const assetsDir = resolve('dist/assets');

if (!existsSync(assetsDir)) {
  console.warn('⚠ dist/assets not found, skipping postbuild');
  process.exit(0);
}

const files = readdirSync(assetsDir);

const cssFile = files.find(f => f.startsWith('main-') && f.endsWith('.css'));
const jsFile = files.find(f => f.startsWith('main-') && f.endsWith('.js') && f !== 'main-BsW5INhO.js');

if (cssFile) {
  mkdirSync(resolve('dist/css'), { recursive: true });
  copyFileSync(resolve(assetsDir, cssFile), resolve('dist/css/main.css'));
  console.log(`✓ CSS → dist/css/main.css`);
}

if (jsFile) {
  mkdirSync(resolve('dist/js'), { recursive: true });
  copyFileSync(resolve(assetsDir, jsFile), resolve('dist/js/main.js'));
  console.log(`✓ JS → dist/js/main.js`);
}
