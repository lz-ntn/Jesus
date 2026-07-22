import { getPostsIndex, createPostCard, slugify } from './posts-data.js';

export async function loadHomePage() {
  const allPosts = await getPostsIndex();
  renderFeaturedPosts(allPosts);
  renderTopics(allPosts);
}

function renderFeaturedPosts(allPosts) {
  const grid = document.getElementById('featured-posts');
  if (!grid) return;

  const featured = allPosts.slice(0, 6);

  if (featured.length === 0) {
    if (!grid.querySelector('.post-card')) {
      grid.innerHTML = '<p class="no-posts">Nenhum artigo publicado ainda.</p>';
    }
    return;
  }

  grid.innerHTML = featured.map((post) => createPostCard(post)).join('');
  grid.removeAttribute('aria-busy');
}

function renderTopics(allPosts) {
  const grid = document.getElementById('topics-grid');
  if (!grid) return;

  const topics = [
    { id: 'jesus-historico', title: 'Jesus Histórico', description: 'Quem foi Jesus de Nazaré, contexto histórico, evidências não-cristãs, o Jesus da Galileia', icon: 'bi-person-lines-fill' },
    { id: 'ensinamentos', title: 'Ensinamentos', description: 'Amor aos inimigos, Reino de Deus, bem-aventuranças, regra de ouro, não-violência', icon: 'bi-book-half' },
    { id: 'hipocrisia-religiosa', title: 'Hipocrisia Religiosa', description: 'Críticas aos fariseus, templos, poder religioso, legalismo vs misericórdia', icon: 'bi-x-octagon' },
    { id: 'riqueza-poder', title: 'Riqueza e Poder', description: 'Camelo e agulha, jovem rico, viúva pobre, acúmulo vs generosidade', icon: 'bi-currency-dollar' },
    { id: 'a-fonte', title: 'A Fonte', description: 'Deus/Abba, Consciência, Reino interior, união direta, experiência mística', icon: 'bi-lightning-charge' },
    { id: 'igreja-historia', title: 'Igreja e História', description: 'Distorções pós-Jesus, cristianismo institucional, versões pasteurizadas', icon: 'bi-building-columns' },
  ];

  const tagCounts = {};
  allPosts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  grid.innerHTML = topics
    .map((topic) => {
      const matching = Object.entries(tagCounts).filter(([tag]) => {
        const t = tag.toLowerCase();
        const id = topic.id;
        return t.includes(id) || id.includes(t) || t.replace(/\s+/g, '-').includes(id);
      });
      const count = matching.reduce((sum, [, n]) => sum + n, 0);
      const href = matching[0]
        ? `/tags/${slugify(matching[0][0])}.html`
        : '/tags.html';

      return `
      <article class="topic-card" role="listitem">
        <div class="topic-icon">
          <i class="bi ${topic.icon}" aria-hidden="true"></i>
        </div>
        <h3>${topic.title}</h3>
        <p>${topic.description}</p>
        <a href="${href}" class="topic-link">
          ${count > 0 ? `${count} artigo${count !== 1 ? 's' : ''}` : 'Explorar'}
          <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </a>
      </article>
    `;
    })
    .join('');
  grid.removeAttribute('aria-busy');
}
