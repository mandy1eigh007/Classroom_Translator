const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const CAPTION_TIMEOUT = 10000;

export function parseYouTubeId(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
      return match ? match[1] : null;
    }
  } catch (_) {}
  return null;
}

async function readTextLimited(response, maxBytes) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('YouTube response was too large');
    }
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}

export async function fetchCaptions(videoId) {
  const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    signal: AbortSignal.timeout(CAPTION_TIMEOUT),
  });
  if (!page.ok) throw new Error(`YouTube page returned ${page.status}`);
  const html = await readTextLimited(page, 4_000_000);
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) throw new Error('No captions for this video');
  let tracks;
  try { tracks = JSON.parse(match[1]); }
  catch (_) { throw new Error('Could not read caption data'); }
  if (!Array.isArray(tracks) || !tracks.length) throw new Error('No captions for this video');
  const track = tracks.find(item => String(item.languageCode || '').startsWith('en')) || tracks[0];
  if (!track || !track.baseUrl) throw new Error('No usable caption track');

  const captionResponse = await fetch(track.baseUrl, { signal: AbortSignal.timeout(CAPTION_TIMEOUT) });
  if (!captionResponse.ok) throw new Error(`Caption track returned ${captionResponse.status}`);
  const xml = await readTextLimited(captionResponse, 2_000_000);
  const cues = [];
  const pattern = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let part;
  while ((part = pattern.exec(xml))) {
    const text = decodeXml(part[3]).replace(/\s+/g, ' ').trim();
    if (text) cues.push({ start: Number(part[1]), dur: Number(part[2]), text });
  }
  if (!cues.length) throw new Error('Caption track was empty');
  return cues;
}

export function cuesToTranscript(cues) {
  return (Array.isArray(cues) ? cues : []).map(cue => String(cue.text || '').trim()).filter(Boolean).join(' ');
}

export async function searchYouTube(env, query, maxResults = 12) {
  if (!env.YOUTUBE_API_KEY) throw new Error('YouTube search is not configured');
  const size = Math.max(1, Math.min(25, Number(maxResults) || 12));
  const params = new URLSearchParams({
    part: 'snippet', type: 'video', videoCaption: 'closedCaption', safeSearch: 'moderate',
    maxResults: String(size), q: String(query || '').trim(), key: env.YOUTUBE_API_KEY,
  });
  const searchResponse = await fetch(`${YOUTUBE_API}/search?${params}`, {
    signal: AbortSignal.timeout(12000),
  });
  const searchData = await searchResponse.json();
  if (!searchResponse.ok) throw new Error(youtubeError(searchData, searchResponse.status));
  const ids = (searchData.items || []).map(item => item.id && item.id.videoId).filter(Boolean);
  if (!ids.length) return [];

  const detailsParams = new URLSearchParams({
    part: 'snippet,contentDetails,status', id: ids.join(','), key: env.YOUTUBE_API_KEY,
  });
  const detailsResponse = await fetch(`${YOUTUBE_API}/videos?${detailsParams}`, {
    signal: AbortSignal.timeout(12000),
  });
  const detailsData = await detailsResponse.json();
  if (!detailsResponse.ok) throw new Error(youtubeError(detailsData, detailsResponse.status));
  const byId = new Map((detailsData.items || []).map(item => [item.id, item]));

  return ids.map(id => {
    const item = byId.get(id) || {};
    const snippet = item.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    const thumb = thumbnails.medium || thumbnails.default || {};
    return {
      youtube_video_id: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title: snippet.title || 'Untitled video',
      channel_id: snippet.channelId || null,
      channel_name: snippet.channelTitle || null,
      published_at: snippet.publishedAt || null,
      duration_seconds: parseDuration(item.contentDetails && item.contentDetails.duration),
      thumbnail_url: thumb.url || null,
      captions_available: item.contentDetails ? item.contentDetails.caption === 'true' : true,
      embeddable: item.status ? item.status.embeddable !== false : true,
    };
  }).filter(item => item.embeddable);
}

export async function fetchYouTubeMetadata(env, videoId) {
  if (!env.YOUTUBE_API_KEY) {
    return { youtube_video_id: videoId, url: `https://www.youtube.com/watch?v=${videoId}` };
  }
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,status', id: videoId, key: env.YOUTUBE_API_KEY,
  });
  const response = await fetch(`${YOUTUBE_API}/videos?${params}`, {
    signal: AbortSignal.timeout(12000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(youtubeError(data, response.status));
  const item = data.items && data.items[0];
  if (!item) throw new Error('YouTube video was not found');
  const snippet = item.snippet || {};
  const thumbnails = snippet.thumbnails || {};
  const thumb = thumbnails.medium || thumbnails.default || {};
  return {
    youtube_video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: snippet.title || 'Untitled video',
    channel_id: snippet.channelId || null,
    channel_name: snippet.channelTitle || null,
    published_at: snippet.publishedAt || null,
    duration_seconds: parseDuration(item.contentDetails && item.contentDetails.duration),
    thumbnail_url: thumb.url || null,
  };
}

function parseDuration(value) {
  const match = String(value || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  return (Number(match[1]) || 0) * 3600 + (Number(match[2]) || 0) * 60 + (Number(match[3]) || 0);
}

function youtubeError(data, status) {
  const message = data && data.error && data.error.message;
  return message || `YouTube API returned ${status}`;
}

function decodeXml(value) {
  return value
    .replace(/&amp;#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, '');
}
