// /api/reply — instructor replies to one student's message. Replaces
// Express /reply. Requires Bearer TEACHER_PASSWORD.
//
// POST { sid, lang, text } -> { ok: true }
//
// The reply is translated into the student's language, stored under the
// student's sid (1h TTL), and picked up by that student's next /api/poll
// (session.replyV is bumped so quiet polls know to look).
import { json, getOrCreateSession, putSession, checkTeacher, LANG_CODES, translateAll, pad13 } from './_lib.js';

const MESSAGE_MAX_LEN = 400;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const auth = await checkTeacher(context, body);
  if (!auth.ok) return auth.response;

  const sid = String(body.sid || body.subId || '').slice(0, 64);
  const lang = String(body.lang || '');
  const text = String(body.text || '').trim().slice(0, MESSAGE_MAX_LEN);
  if (!sid || !LANG_CODES[lang] || !text) return json({ error: 'Bad request' }, 400);

  let tr = '';
  try { tr = await translateAll(env, text, lang, 15000); } catch (_) {}

  const ts = Date.now();
  await env.SESSION_KV.put(`reply:${sid}:${pad13(ts)}`, JSON.stringify({
    en: text, tr: tr || text, ts,
  }), { expirationTtl: 60 * 60 });

  const s = await getOrCreateSession(env);
  s.replyV = (s.replyV || 0) + 1;
  await putSession(env, s);

  return json({ ok: true, delivered: 1 });
}
