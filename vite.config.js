import { defineConfig } from 'vite';
import { resolve } from 'path';
import { glob } from 'glob';

const htmlFiles = await glob('src/**/*.html');

const input = {};
htmlFiles.forEach(file => {
  const name = file.replace('src/', '').replace('.html', '').replace(/\//g, '-');
  input[name] = resolve(__dirname, file);
});

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input,
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});