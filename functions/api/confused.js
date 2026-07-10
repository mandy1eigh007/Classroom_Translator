// /api/confused — student taps "I'm lost". Replaces Express /confused.
//
// POST { c, lang, sessionId, kid?, avatar?, initial? } -> { ok: true }
//
// Stored as confused:{lang}:{sid} with a 60s TTL. The teacher's /api/status
// only counts flags newer than the last publish (the Express version cleared
// them on publish; here the timestamp comparison gives the same behavior
// without KV deletes).
import { json, getOrCreateSession, LANG_CODES } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const room = String(body.c || '');
  const lang = String(body.lang || '');
  const sid = String(body.sessionId || '').slice(0, 64);
  if (!LANG_CODES[lang] || !sid) return json({ error: 'Bad request' }, 400);

  const s = await getOrCreateSession(env);
  if (room !== s.code) return json({ error: 'Class ended' }, 410);

  const isKid = !!body.kid;
  await env.SESSION_KV.put(`confused:${lang}:${sid}`, '1', {
    metadata: {
      ts: Date.now(),
      kid: isKid,
      avatar: isKid ? String(body.avatar || '').slice(0, 64) : '',
      initial: isKid ? String(body.initial || '').slice(0, 2).toUpperCase() : '',
    },
    expirationTtl: 60,
  });
  return json({ ok: true });
}
