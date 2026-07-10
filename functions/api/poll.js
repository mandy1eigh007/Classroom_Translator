// /api/poll — the student's heartbeat. Replaces the Express SSE /stream.
//
// GET /api/poll?since={ts}&lang={langName}&c={roomCode}&sid={sessionId}
//              &rv={lastSeenReplyV}&hb=1
//
// Response:
//   {
//     active: true|false,        // false => class ended / link stale
//     messages: [{ id, ts, en, tr, err? }],
//     replies:  [{ id, en, tr, ts }],       // teacher replies to THIS sid
//     state: { epoch, videoV, docV, replyV, lastPublishTs }
//   }
//
// Clients poll every 2 seconds. Design notes:
//  - One KV read (the session doc) on quiet polls; message list + per-language
//    translation reads only when something new was published.
//  - Translations are computed once per (utterance, language) and cached in
//    KV, so 15 students in Spanish cost one OpenAI call, not fifteen.
//  - `epoch` change tells the client to clear its feed (history cleared).
//  - `videoV` / `docV` changes tell the client to refetch /api/video or
//    /api/document.
//  - `hb=1` (sent by the client every ~25s) records presence for the
//    teacher's student counter without a KV write on every poll.
import { json, getOrCreateSession, LANG_CODES, cachedTranslate } from './_lib.js';

const MAX_BATCH = 25;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const url = new URL(request.url);
  const since = Number(url.searchParams.get('since')) || 0;
  const lang = url.searchParams.get('lang') || '';
  const room = url.searchParams.get('c') || '';
  const sid = (url.searchParams.get('sid') || '').slice(0, 64);
  const rv = Number(url.searchParams.get('rv')) || 0;
  const hb = url.searchParams.get('hb') === '1';

  if (!LANG_CODES[lang]) return json({ error: 'Unsupported language' }, 400);

  const s = await getOrCreateSession(env);
  if (room !== s.code) {
    return json({ active: false, ended: true, messages: [] });
  }

  // Presence heartbeat (throttled client-side to ~every 25s).
  if (hb && sid) {
    context.waitUntil(env.SESSION_KV.put('presence:' + sid, '1', {
      metadata: { lang, ts: Date.now() },
      expirationTtl: 60,
    }));
  }

  const state = {
    epoch: s.epoch,
    videoV: s.videoV,
    docV: s.docV,
    replyV: s.replyV,
    lastPublishTs: s.lastPublishTs || 0,
  };

  // New utterances?
  let messages = [];
  if ((s.latestTs || 0) > since) {
    const prefix = `msg:${s.epoch}:`;
    // List keys strictly after `since` (keys are zero-padded timestamps, so
    // lexicographic order == numeric order).
    const res = await env.SESSION_KV.list({ prefix, limit: 1000 });
    const fresh = res.keys
      .map(k => ({ key: k.name, ts: Number(k.name.slice(prefix.length)) || 0, meta: k.metadata || {} }))
      .filter(k => k.ts > since)
      .slice(-MAX_BATCH); // if the student is way behind, skip to the newest chunk

    messages = await Promise.all(fresh.map(async (k) => {
      let en = typeof k.meta.en === 'string' ? k.meta.en : null;
      if (en == null) en = (await env.SESSION_KV.get(k.key)) || '';
      const out = { id: k.ts, ts: k.ts, en };
      try {
        out.tr = lang === 'English' ? en : await cachedTranslate(env, en, lang, 12000);
      } catch (e) {
        out.tr = en;
        out.err = true;
      }
      return out;
    }));
  }

  // Teacher replies addressed to this student. Only checked when the
  // session's replyV moved past what the client last saw; the client
  // dedupes by id, so returning the most recent few is safe.
  let replies = [];
  if (sid && s.replyV > rv) {
    const rp = `reply:${sid}:`;
    const rres = await env.SESSION_KV.list({ prefix: rp, limit: 20 });
    const recent = rres.keys.slice(-10);
    replies = (await Promise.all(recent.map(async (k) => {
      const v = await env.SESSION_KV.get(k.name, 'json');
      return v ? { id: Number(k.name.slice(rp.length)) || 0, ...v } : null;
    }))).filter(Boolean);
  }

  return json({ active: true, messages, replies, state });
}
