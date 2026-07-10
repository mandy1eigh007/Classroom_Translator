// /api/message — teacher publishes a finalized English utterance.
// Replaces Express /publish. Requires Bearer TEACHER_PASSWORD.
//
// POST { text, c } -> { id, ts }
//
// The utterance is written to SESSION_KV as msg:{epoch}:{ts13}. The English
// text rides in key metadata (so /api/poll can list without extra reads);
// utterances longer than the metadata budget also store the text as the
// value. Students' /api/poll picks it up within one 2s poll cycle and
// translates on demand (cached per language).
import { json, getOrCreateSession, putSession, checkTeacher, pad13, MSG_TTL } from './_lib.js';

const META_TEXT_MAX = 850; // stay under KV's 1024-byte metadata cap

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const auth = await checkTeacher(context, body);
  if (!auth.ok) return auth.response;

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return json({ error: 'Missing text' }, 400);

  const s = await getOrCreateSession(env);
  // Reject publishes that belong to an already-rotated class so queued
  // speech can't bleed into the new session.
  const cls = typeof body.c === 'string' ? body.c : '';
  if (cls && cls !== s.code) return json({ error: 'Class ended' }, 410);

  // Monotonic id: timestamps can collide at ms resolution if the teacher
  // publishes rapid-fire; nudge forward past the last one.
  const ts = Math.max(Date.now(), (s.latestTs || 0) + 1);
  const key = `msg:${s.epoch}:${pad13(ts)}`;
  const meta = text.length <= META_TEXT_MAX ? { en: text } : { long: true };
  await env.SESSION_KV.put(key, text, { metadata: meta, expirationTtl: MSG_TTL });

  s.latestTs = ts;
  s.lastPublishTs = ts; // teacher spoke -> "I'm lost" flags are considered addressed
  await putSession(env, s);

  return json({ id: ts, ts });
}
