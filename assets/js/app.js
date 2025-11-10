let allVideos = [];

// Decide how to embed based on URL
function createEmbedElement(video) {
  const url = (video.url || '').trim();
  if (!url) return null;

  const lower = url.toLowerCase();

  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.height = '260';
  iframe.className = 'video-embed-frame';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowfullscreen', 'true');
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  );

  // YouTube
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) {
      const videoId = match[1];
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      return iframe;
    }
  }

  // Facebook video plugin
  if (lower.includes('facebook.com')) {
    const pluginSrc =
      'https://www.facebook.com/plugins/video.php?href=' +
      encodeURIComponent(url) +
      '&show_text=0&width=560';
    iframe.src = pluginSrc;
    iframe.height = '320';
    return iframe;
  }

  // Instagram embed
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    let embedUrl = url;
    if (!embedUrl.endsWith('/')) embedUrl += '/';
    if (!embedUrl.toLowerCase().includes('/embed')) {
      embedUrl += 'embed';
    }
    iframe.src = embedUrl;
    iframe.height = '320';
    return iframe;
  }

  // Default: try to iframe the URL (may or may not be allowed by the site)
  iframe.src = url;
  return iframe;
}

async function loadVideos() {
  try {
    const res = await fetch('data/videos.json');
    if (!res.ok) {
      throw new Error('Failed to load videos.json');
    }
    allVideos = await res.json();
    const category = typeof CATEGORY_FILTER !== 'undefined' ? CATEGORY_FILTER : null;
    const videosForPage = category
      ? allVideos.filter(
          (v) => (v.category || '').toLowerCase() === category.toLowerCase()
        )
      : allVideos;

    renderTopics(videosForPage);
    renderVideos(videosForPage);
  } catch (err) {
    console.error(err);
    const container = document.getElementById('videoList');
    if (container) {
      container.textContent = 'Could not load videos. Please try again later.';
    }
  }
}

function renderTopics(videos) {
  const topicFilter = document.getElementById('topicFilter');
  if (!topicFilter) return;

  const topics = Array.from(
    new Set(
      videos
        .map((v) => v.topic)
        .filter(Boolean)
    )
  ).sort();

  topics.forEach((topic) => {
    const opt = document.createElement('option');
    opt.value = topic;
    opt.textContent = topic;
    topicFilter.appendChild(opt);
  });
}

function renderVideos(videos) {
  const container = document.getElementById('videoList');
  if (!container) return;

  container.innerHTML = '';

  if (!videos.length) {
    container.textContent = 'No videos found in this category.';
    return;
  }

  videos.forEach((video) => {
    const card = document.createElement('div');
    card.className = 'video-card';

    const title = document.createElement('h2');
    title.textContent = video.title;

    const meta = document.createElement('div');
    meta.className = 'video-meta';
    const topicText = video.topic || 'General';
    const platformText = video.platform || 'Unknown';
    meta.textContent = `${topicText} • ${platformText}`;

    const embedWrapper = document.createElement('div');
    embedWrapper.className = 'video-embed';
    const embed = createEmbedElement(video);
    if (embed) {
      embedWrapper.appendChild(embed);
    }

    const actions = document.createElement('div');
    actions.className = 'video-actions';

    const link = document.createElement('a');
    link.href = video.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open video in new tab';

    actions.appendChild(link);

    card.appendChild(title);
    card.appendChild(meta);
    if (embed) {
      card.appendChild(embedWrapper);
    }
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

  const baseVideos = category
    ? allVideos.filter(
        (v) => (v.category || '').toLowerCase() === category.toLowerCase()
      )
    : allVideos;

  const filtered = baseVideos.filter((v) => {
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

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
    if (topicFilter) {
      topicFilter.addEventListener('change', applyFilters);
    }
  }
});
