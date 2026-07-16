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
import { fetchCaptions, parseYouTubeId } from './_youtube.js';

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
