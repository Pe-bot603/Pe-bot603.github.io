const postList = document.getElementById('postList');
const btnReload = document.getElementById('btnReload');
const btnSort = document.getElementById('btnSort');
const postForm = document.getElementById('postForm');
const postsStatus = document.getElementById('postsStatus');
const defaultPostsData = document.getElementById('defaultPostsData');

const LOCAL_POSTS_KEY = 'bolinhomod.local.posts';

let postsCache = [];
let sortDescending = true;

const formatDate = isoDate => new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR');

const getLocalPosts = () => {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_POSTS_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const saveLocalPosts = posts => {
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
};

const getEmbeddedPosts = () => {
  try {
    const parsed = JSON.parse(defaultPostsData?.textContent || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setStatus = message => {
  if (postsStatus) postsStatus.textContent = message;
};

const renderPosts = posts => {
  if (!posts.length) {
    postList.innerHTML = '<p class="empty">Nenhum post encontrado.</p>';
    return;
  }

  postList.innerHTML = posts.map(post => `
    <article class="post card">
      <h2>${post.title}</h2>
      <div class="meta">${formatDate(post.date)} • ${post.author}</div>
      <p>${post.content}</p>
    </article>
  `).join('');
};

const sortPosts = posts => [...posts].sort((a, b) => {
  const aDate = new Date(a.date).getTime();
  const bDate = new Date(b.date).getTime();
  return sortDescending ? bDate - aDate : aDate - bDate;
});

const loadPosts = async () => {
  postList.innerHTML = '<p class="empty">Carregando posts...</p>';
  setStatus('');

  try {
    const response = await fetch('./posts.json', {cache: 'no-store'});
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

    const remoteData = await response.json();
    const remotePosts = Array.isArray(remoteData) ? remoteData : [];
    const localPosts = getLocalPosts();

    postsCache = [...remotePosts, ...localPosts];
    renderPosts(sortPosts(postsCache));
    setStatus('Posts carregados de posts.json e do armazenamento local.');
  } catch (error) {
    const embeddedPosts = getEmbeddedPosts();
    const localPosts = getLocalPosts();
    postsCache = [...embeddedPosts, ...localPosts];
    renderPosts(sortPosts(postsCache));
    setStatus(`Fallback local em uso (não foi possível carregar posts.json: ${error.message}).`);
  }
};

postForm?.addEventListener('submit', event => {
  event.preventDefault();

  const formData = new FormData(postForm);
  const title = String(formData.get('title') || '').trim();
  const author = String(formData.get('author') || '').trim();
  const content = String(formData.get('content') || '').trim();

  if (!title || !author || !content) return;

  const newPost = {
    id: Date.now(),
    title,
    author,
    content,
    date: new Date().toISOString().slice(0, 10),
    local: true
  };

  const localPosts = [newPost, ...getLocalPosts()];
  saveLocalPosts(localPosts);

  postsCache = [...postsCache, newPost];
  renderPosts(sortPosts(postsCache));
  postForm.reset();
});

btnReload?.addEventListener('click', loadPosts);
btnSort?.addEventListener('click', () => {
  sortDescending = !sortDescending;
  renderPosts(sortPosts(postsCache));
});

loadPosts();
