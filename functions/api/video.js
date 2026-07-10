// /api/video — shared, synced YouTube video. Replaces Express /video/set,
// /video/control, /video/clear and the SSE 'video' / 'video-caption' events.
//
// GET  ?cues=1        -> { videoId, state, positionSec, updatedAt, serverTime,
//                          hasCaptions, cues?: [{start, dur, text}] }
// POST (teacher)      -> { action: "set", url }        load a video
//                        { action: "control", state, positionSec, seq }
//                        { action: "clear" }
//
// Captions: fetched best-effort at load time by scraping YouTube's caption
// track (a port of the youtube-transcript approach using plain fetch —
// the npm package itself doesn't run in Workers). If YouTube blocks the
// request or the video has no captions, students still get the synced
// video, just without translated captions — the teacher is told plainly.
// Students compute the current cue locally from (positionSec, updatedAt)
// and translate it through /api/translate (KV-cached per language).
import { json, getOrCreateSession, putSession, checkTeacher } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const state = await env.SESSION_KV.get('video:state', 'json');
    if (!state) return json({ videoId: null, serverTime: Date.now() });
    const out = { ...state, serverTime: Date.now() };
    if (url.searchParams.get('cues') === '1') {
      out.cues = (await env.SESSION_KV.get('video:cues', 'json')) || [];
    }
    return json(out);
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const auth = await checkTeacher(context, body);
  if (!auth.ok) return auth.response;

  const action = String(body.action || '');
  const s = await getOrCreateSession(env);

  if (action === 'set') {
    const id = parseYouTubeId(body.url);
    if (!id) return json({ error: 'Could not read a YouTube link from that input.' }, 400);
    let cues = [];
    let captionsError = null;
    try { cues = await fetchCaptions(id); }
    catch (e) { captionsError = (e && e.message) || 'No captions for this video'; }
    const state = {
      videoId: id, state: 'paused', positionSec: 0,
      updatedAt: Date.now(), hasCaptions: cues.length > 0, lastSeq: 0,
    };
    await env.SESSION_KV.put('video:state', JSON.stringify(state));
    await env.SESSION_KV.put('video:cues', JSON.stringify(cues));
    s.videoV += 1;
    await putSession(env, s);
    return json({ ok: true, videoId: id, hasCaptions: cues.length > 0, captionCount: cues.length, captionsError: captionsError || undefined });
  }

  if (action === 'control') {
    const state = await env.SESSION_KV.get('video:state', 'json');
    if (!state) return json({ error: 'No video loaded' }, 400);
    const st = body.state;
    if (st !== 'playing' && st !== 'paused') return json({ error: 'Bad state' }, 400);
    const n = Number(body.seq);
    if (Number.isFinite(n)) {
      if (state.lastSeq != null && n < state.lastSeq) return json({ ok: true, dropped: true });
      state.lastSeq = n;
    }
    state.state = st;
    state.positionSec = Math.max(0, Number(body.positionSec) || 0);
    state.updatedAt = Date.now();
    await env.SESSION_KV.put('video:state', JSON.stringify(state));
    s.videoV += 1;
    await putSession(env, s);
    return json({ ok: true });
  }

  if (action === 'clear') {
    await env.SESSION_KV.delete('video:state');
    await env.SESSION_KV.delete('video:cues');
    s.videoV += 1;
    await putSession(env, s);
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

function parseYouTubeId(url) {
  if (typeof url !== 'string') return null;
  const str = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
  try {
    const u = new URL(str);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') {
        const v = u.searchParams.get('v');
        return v && /^[A-Za-z0-9_-]{11}$/.test(v) ? v : null;
      }
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch (_) {}
  return null;
}

// Best-effort caption scrape: load the watch page, find captionTracks,
// prefer English, fetch the XML track, and parse cues. YouTube changes
// this markup and rate-limits datacenter IPs, so every failure path is a
// clean "no captions" rather than a crash.
async function fetchCaptions(videoId) {
  const CAPTION_TIMEOUT = 8000;
  const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    signal: AbortSignal.timeout(CAPTION_TIMEOUT),
  });
  const htmlText = await page.text();
  const m = htmlText.match(/"captionTracks":(\[.*?\])/);
  if (!m) throw new Error('No captions for this video');
  let tracks;
  try { tracks = JSON.parse(m[1]); } catch (_) { throw new Error('Could not read caption data'); }
  if (!Array.isArray(tracks) || !tracks.length) throw new Error('No captions for this video');
  const track = tracks.find(t => (t.languageCode || '').startsWith('en')) || tracks[0];
  if (!track || !track.baseUrl) throw new Error('No usable caption track');
  const xmlRes = await fetch(track.baseUrl, { signal: AbortSignal.timeout(CAPTION_TIMEOUT) });
  const xml = await xmlRes.text();
  const cues = [];
  const re = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let t;
  while ((t = re.exec(xml))) {
    const text = decodeXml(t[3]).replace(/\s+/g, ' ').trim();
    if (text) cues.push({ start: parseFloat(t[1]), dur: parseFloat(t[2]), text });
  }
  if (!cues.length) throw new Error('Caption track was empty');
  return cues;
}

function decodeXml(sIn) {
  return sIn
    .replace(/&amp;#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, '');
}
