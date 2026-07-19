import fs from 'fs';
import path from 'path';

const POSTS_SRC = 'src/pages/posts';
const POSTS_DEST = 'dist/posts';
const TAGS_SRC = 'src/pages/tags';
const TAGS_DEST = 'dist/tags';

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stat = fs.statSync(srcFile);
    
    if (stat.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

async function copyGeneratedPages() {
  copyDir(POSTS_SRC, POSTS_DEST);
  copyDir(TAGS_SRC, TAGS_DEST);
  
  // Copy archive.html
  if (fs.existsSync('src/pages/archive.html')) {
    fs.copyFileSync('src/pages/archive.html', 'dist/archive.html');
  }
  
  console.log('✓ Copied generated pages to dist/');
}

copyGeneratedPages().catch(console.error);