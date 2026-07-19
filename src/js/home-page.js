import { CONFIG } from './config.js';

export async function loadHomePage() {
  await loadFeaturedPosts();
  renderTopics();
}

let allPosts = [];

async function loadFeaturedPosts() {
  try {
    const response = await fetch('/data/posts-index.json');
    if (response.ok) {
      allPosts = await response.json();
      renderFeaturedPosts();
    }
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
  }
}

function renderFeaturedPosts() {
  const grid = document.getElementById('featured-posts');
  if (!grid) return;
  
  const featured = allPosts.slice(0, 6);
  
  if (featured.length === 0) {
    grid.innerHTML = '<p class="no-posts">Nenhum artigo publicado ainda.</p>';
    return;
  }
  
  grid.innerHTML = featured.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
  const date = new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const tags = post.tags.slice(0, 2).map(tag => `<a href="/tags/${slugify(tag)}.html" class="tag">${escapeHtml(tag)}</a>`).join('');
  
  return `
    <article class="post-card" role="listitem">
      <header>
        <time datetime="${post.date}">${date}</time>
        <h2><a href="/posts/${post.slug}.html">${escapeHtml(post.title)}</a></h2>
      </header>
      <p class="excerpt">${escapeHtml(post.excerpt)}</p>
      <footer>
        <span class="reading-time"><i class="bi bi-clock" aria-hidden="true"></i> ${post.readingTime} min</span>
        <div class="tags">${tags}</div>
      </footer>
    </article>
  `;
}

function renderTopics() {
  const grid = document.getElementById('topics-grid');
  if (!grid) return;
  
  const topics = [
    { id: 'jesus-historico', title: 'Jesus Histórico', description: 'Quem foi Jesus de Nazaré, contexto histórico, evidências não-cristãs, o Jesus da Galileia', icon: 'bi-person-lines-fill', count: 0 },
    { id: 'ensinamentos', title: 'Ensinamentos', description: 'Amor aos inimigos, Reino de Deus, bem-aventuranças, regra de ouro, não-violência', icon: 'bi-book-half', count: 0 },
    { id: 'hipocrisia-religiosa', title: 'Hipocrisia Religiosa', description: 'Críticas aos fariseus, templos, poder religioso, legalismo vs misericórdia', icon: 'bi-x-octagon', count: 0 },
    { id: 'riqueza-poder', title: 'Riqueza e Poder', description: 'Camelo e agulha, jovem rico, viúva pobre, acúmulo vs generosidade', icon: 'bi-currency-dollar', count: 0 },
    { id: 'a-fonte', title: 'A Fonte', description: 'Deus/Abba, Consciência, Reino interior, união direta, experiência mística', icon: 'bi-lightning-charge', count: 0 },
    { id: 'igreja-historia', title: 'Igreja e História', description: 'Distorções pós-Jesus, cristianismo institucional, versões pasteurizadas', icon: 'bi-building-columns', count: 0 },
  ];
  
  const tagCounts = {};
  allPosts.forEach(post => {
    post.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  topics.forEach(topic => {
    const matchingTag = Object.keys(tagCounts).find(tag => 
      tag.toLowerCase().includes(topic.id) || topic.id.includes(tag.toLowerCase())
    );
    if (matchingTag) topic.count = tagCounts[matchingTag];
  });
  
  grid.innerHTML = topics.map(topic => `
    <article class="topic-card" role="listitem">
      <div class="topic-icon">
        <i class="bi ${topic.icon}" aria-hidden="true"></i>
      </div>
      <h3>${topic.title}</h3>
      <p>${topic.description}</p>
      <a href="/tags.html#tag-${slugify(topic.id)}" class="topic-link">
        ${topic.count > 0 ? `${topic.count} artigo${topic.count !== 1 ? 's' : ''}` : 'Em breve'}
        <i class="bi bi-arrow-right" aria-hidden="true"></i>
      </a>
    </article>
  `).join('');
}

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}