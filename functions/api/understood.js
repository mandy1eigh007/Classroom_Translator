// /api/understood — student taps "Got it". Replaces Express /understood.
//
// POST { c, lang, sessionId, avatar?, initial? } -> { ok: true, utterId }
//
// Attaches to the most recent utterance (session.latestTs) — that's the
// sentence the student just heard. Dedup by sid is automatic: the KV key is
// und:{utterTs}:{sid}, so tap-spamming just overwrites the same key.
import { json, getOrCreateSession, LANG_CODES, pad13 } from './_lib.js';

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
  if (!s.latestTs) return json({ ok: true, dropped: 'no-utterance' });

  await env.SESSION_KV.put(`und:${pad13(s.latestTs)}:${sid}`, '1', {
    metadata: {
      avatar: String(body.avatar || '').slice(0, 64),
      initial: String(body.initial || '').slice(0, 2).toUpperCase(),
      ts: Date.now(),
    },
    expirationTtl: 60 * 30,
  });
  return json({ ok: true, utterId: s.latestTs });
}
