let allVideos = [];

// Helper: get a nice thumbnail URL if possible
function getThumbnailUrl(video) {
  const url = (video.url || '').trim();
  if (!url) return null;

  // If thumbnail explicitly provided in data, use that
  if (video.thumbnail && video.thumbnail.trim()) {
    return video.thumbnail.trim();
  }

  const lower = url.toLowerCase();

  // Auto-thumbnail for YouTube
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) {
      const videoId = match[1];
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }
  return null;
}

// Decide how to embed based on URL (YouTube/Instagram only)
function createEmbedElement(video) {
  const url = (video.url || '').trim();
  if (!url) return null;
  const lower = url.toLowerCase();

  // YouTube embed
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) {
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '260';
      iframe.src = `https://www.youtube.com/embed/${match[1]}`;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      return iframe;
    }
  }

  // Instagram embed
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    let embedUrl = url;
    if (!embedUrl.endsWith('/')) embedUrl += '/';
    if (!embedUrl.toLowerCase().includes('/embed')) embedUrl += 'embed';
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '320';
    iframe.src = embedUrl;
    iframe.setAttribute('frameborder', '0');
    return iframe;
  }

  // Facebook and other platforms: do not embed to avoid "Video unavailable".
  return null;
}

async function loadVideos() {
  try {
    const res = await fetch('data/videos.json');
    allVideos = await res.json();
    const category = typeof CATEGORY_FILTER !== 'undefined' ? CATEGORY_FILTER : null;
    const vids = category ? allVideos.filter(v => (v.category || '').toLowerCase() === category.toLowerCase()) : allVideos;
    renderTopics(vids);
    renderVideos(vids);
  } catch (e) {
    const c = document.getElementById('videoList');
    if (c) c.textContent = 'Could not load videos.';
  }
}

function renderTopics(videos) {
  const topicFilter = document.getElementById('topicFilter');
  if (!topicFilter) return;
  const topics = Array.from(new Set(videos.map(v=>v.topic).filter(Boolean))).sort();
  topics.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    topicFilter.appendChild(opt);
  });
}

function renderVideos(videos) {
  const container = document.getElementById('videoList');
  if (!container) return;
  container.innerHTML='';
  if (!videos.length) { container.textContent='No videos found in this category.'; return; }

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';

    const title = document.createElement('h2');
    title.textContent = video.title;

    const meta = document.createElement('div');
    meta.className = 'video-meta';
    const topicText = video.topic || 'General';
    const platformText = video.platform || 'Unknown';
    meta.textContent = `${topicText} • ${platformText}`;

    const embed = createEmbedElement(video);
    if (embed) {
      const wrap = document.createElement('div');
      wrap.className = 'video-embed';
      wrap.appendChild(embed);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(wrap);
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'video-thumb';
      const a = document.createElement('a');
      a.href = video.url; a.target = '_blank'; a.rel='noopener noreferrer';
      const thumb = getThumbnailUrl(video);
      if (thumb) {
        const img = document.createElement('img');
        img.src = thumb; img.alt = video.title;
        a.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'video-thumb-placeholder';
        ph.textContent = platformText === 'Unknown' ? 'Open video' : `${platformText} video`;
        a.appendChild(ph);
      }
      wrap.appendChild(a);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(wrap);
    }

    const actions = document.createElement('div');
    actions.className = 'video-actions';
    const link = document.createElement('a');
    link.href = video.url; link.target = '_blank'; link.rel='noopener noreferrer';
    link.textContent = 'Open video in new tab';
    actions.appendChild(link);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const topicFilter = document.getElementById('topicFilter');
  const category = typeof CATEGORY_FILTER !== 'undefined' ? CATEGORY_FILTER : null;

  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const topic = topicFilter ? topicFilter.value : '';

  const base = category ? allVideos.filter(v => (v.category || '').toLowerCase() === category.toLowerCase()) : allVideos;
  const filtered = base.filter(v => {
    const matchesTopic = topic ? v.topic === topic : true;
    const text = `${v.title} ${v.topic || ''}`.toLowerCase();
    const matchesSearch = search ? text.includes(search) : true;
    return matchesTopic && matchesSearch;
  });

  renderVideos(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('videoList')) {
    loadVideos();
    const searchInput = document.getElementById('searchInput');
    const topicFilter = document.getElementById('topicFilter');
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (topicFilter) topicFilter.addEventListener('change', applyFilters);
  }
});
