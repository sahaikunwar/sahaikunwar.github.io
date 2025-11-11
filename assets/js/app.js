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

  // For Facebook/Instagram/others, we can't reliably fetch a thumbnail from the URL
  // in a static GitHub Pages site, so we fall back to a placeholder.
  return null;
}

// Decide how to embed based on URL (YouTube/Instagram only)
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

  // YouTube embed
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) {
      const videoId = match[1];
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      return iframe;
    }
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

  // Facebook and other platforms: do not embed to avoid "Video unavailable".
  return null;
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

    // Try embed first (for YouTube/Instagram)
    const embed = createEmbedElement(video);

    if (embed) {
      const embedWrapper = document.createElement('div');
      embedWrapper.className = 'video-embed';
      embedWrapper.appendChild(embed);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(embedWrapper);
    } else {
      // Otherwise show a thumbnail-style preview like WhatsApp
      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'video-thumb';

      const link = document.createElement('a');
      link.href = video.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      const thumbUrl = getThumbnailUrl(video);
      if (thumbUrl) {
        const img = document.createElement('img');
        img.src = thumbUrl;
        img.alt = video.title;
        link.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'video-thumb-placeholder';
        placeholder.textContent = platformText === 'Unknown'
          ? 'Open video'
          : `${platformText} video`;
        link.appendChild(placeholder);
      }

      thumbWrapper.appendChild(link);

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(thumbWrapper);
    }

    const actions = document.createElement('div');
    actions.className = 'video-actions';

    const openLink = document.createElement('a');
    openLink.href = video.url;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.textContent = 'Open video in new tab';

    actions.appendChild(openLink);
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
