/*******************************
 * D4E – Sheet-backed video loader
 * REPLACE the whole app.js with this file.
 *******************************/
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwfpTrrhB5nRbPNvjQqLTAwawyEnieaDJ0VqAjSrMDmOox0JPP_Yuu0QKfej1QqcJE/exec";
// ↑ Use your own /exec URL

let allVideos = [];

/* ---------- Helpers ---------- */

// Build a nice thumbnail if not provided
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

  // Instagram embed (may fail on some pages due to CORS/policy—fallback is thumbnail link)
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

  // Facebook and other platforms: do not iframe (thumbnail/link instead)
  return null;
}

/* ---------- NEW: Load from Google Sheet Web App ---------- */

async function fetchSectionFromSheet(sectionName) {
  const url = `${WEB_APP_URL}?section=${encodeURIComponent(sectionName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet API HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.items)) throw new Error('Invalid sheet JSON');

  // Map sheet columns → your existing front-end structure
  // Sheet fields: Section, Platform, SourceURL, EmbedType, VideoID, Title, Description,
  // ThumbnailURL, Duration, Language, Publish, SortOrder, StartDate, EndDate, Tags
  const mapped = data.items
    .sort((a, b) => Number(a.SortOrder || 999999) - Number(b.SortOrder || 999999))
    .map(item => {
      // Choose a primary topic from Tags (first tag) for your filter dropdown
      const firstTag = (item.Tags || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)[0] || '';

      // Prefer explicit thumbnail; else auto-generate for YouTube if VideoID present
      const explicitThumb = (item.ThumbnailURL || '').trim();
      const autoYouTubeThumb = (item.Platform === 'YouTube' && item.VideoID)
        ? `https://img.youtube.com/vi/${item.VideoID}/hqdefault.jpg`
        : '';

      return {
        title: item.Title || '',
        url: item.SourceURL || '',
        platform: item.Platform || '',
        topic: firstTag,                    // used by your topic filter
        category: item.Section || sectionName, // page-level section
        thumbnail: explicitThumb || autoYouTubeThumb
      };
    });

  return mapped;
}

/* ---------- Legacy JSON fallback (kept, just in case) ---------- */
async function fetchFromLocalJSON(category) {
  const res = await fetch('data/videos.json');
  const raw = await res.json();
  return category
    ? raw.filter(v => (v.category || '').toLowerCase() === category.toLowerCase())
    : raw;
}

/* ---------- Entry point ---------- */

async function loadVideos() {
  const container = document.getElementById('videoList');
  const category = (typeof CATEGORY_FILTER !== 'undefined' && CATEGORY_FILTER) ? CATEGORY_FILTER : null;

  try {
    if (!WEB_APP_URL) throw new Error('WEB_APP_URL missing');
    if (!category) throw new Error('CATEGORY_FILTER missing on page');

    // Primary path: Sheet → JSON
    allVideos = await fetchSectionFromSheet(category);
  } catch (e) {
    console.warn('Sheet fetch failed, falling back to local JSON:', e.message);
    // Fallback to local JSON file if present
    try {
      allVideos = await fetchFromLocalJSON(category);
    } catch (err) {
      console.error('Local JSON fetch failed:', err);
      if (container) container.textContent = 'Could not load videos.';
      return;
    }
  }

  renderTopics(allVideos);
  renderVideos(allVideos);
}

/* ---------- Rendering & filters (unchanged) ---------- */

function renderTopics(videos) {
  const topicFilter = document.getElementById('topicFilter');
  if (!topicFilter) return;
  // Reset (avoid duplicate options on re-render)
  topicFilter.innerHTML = `<option value="">All topics</option>`;
  const topics = Array.from(new Set(videos.map(v => v.topic).filter(Boolean))).sort();
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
      const thumb = getThumbnailUrl(video) || video.thumbnail;
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
