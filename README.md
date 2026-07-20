# Jesus, sem filtros

Visão histórica e direta sobre Jesus de Nazaré — sem maquiagem religiosa, sem romantismo new age, sem cinismo barato.

## Sobre

Site estático gerado a partir de posts em Markdown, com busca client-side, tema claro/escuro, sistema de tags e RSS.

## Tecnologias

- **Vite** — build rápido e dev server
- **Vanilla JS** — sem frameworks, módulos ES
- **Markdown + Front-matter** — conteúdo versionável
- **CSS Custom Properties** — design system com tema claro/escuro

## Estrutura

```
content/posts/     # Posts em Markdown (fonte do conteúdo)
src/               # Código-fonte (HTML, CSS, JS)
scripts/build.js   # Build unificado (gera páginas, RSS, sitemap)
public/            # Assets estáticos (manifest, robots)
dist/              # Build de produção (gerado, não versionado)
```

## Desenvolvimento

```bash
npm install
npm run dev        # Build + dev server na porta 3000
```

## Build

```bash
npm run build      # Gera dist/ com todas as páginas
npm run preview    # Preview do build local
```

O build executa `scripts/build.js` que:
1. Lê todos os posts Markdown
2. Gera páginas HTML para posts e tags
3. Gera `posts-index.json` (índice para busca)
4. Gera `feed.xml` (RSS) e `sitemap.xml`

Depois, o Vite processa as páginas raiz de `src/`.

## Deploy

O site é deployado automaticamente no [Render](https://render.com) a cada push na branch `main`.

Configuração:
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

## Licença

- **Conteúdo:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt)
- **Código:** [MIT License](LICENSE)
