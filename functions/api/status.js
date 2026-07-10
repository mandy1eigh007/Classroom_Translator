// /api/status — teacher dashboard poll (and public audience counter).
// Replaces Express /status. The teacher's page polls this every 5 seconds.
//
// GET -> {
//   students, byLang,                 // from presence heartbeats (60s TTL)
//   confused: {lang: n},              // "I'm lost" flags newer than last publish
//   confusedKids: {lang: [{sid, avatar, initial, ts}]},
//   understood: {utterId: [{sid, avatar, initial}]},
//   messages: [...]                   // student->teacher messages, teacher auth only
// }
import { json, getOrCreateSession, teacherPassword, providedPasscode } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const s = await getOrCreateSession(env);
  const now = Date.now();

  // Presence -> student counts by language.
  const byLang = {};
  let students = 0;
  const pres = await env.SESSION_KV.list({ prefix: 'presence:', limit: 1000 });
  for (const k of pres.keys) {
    const m = k.metadata || {};
    if (!m.lang) continue;
    students++;
    byLang[m.lang] = (byLang[m.lang] || 0) + 1;
  }

  // Confused — only flags newer than the teacher's last publish count
  // (publishing "answers" the raised hands, matching the old behavior).
  const confused = {};
  const confusedKids = {};
  const conf = await env.SESSION_KV.list({ prefix: 'confused:', limit: 1000 });
  for (const k of conf.keys) {
    const m = k.metadata || {};
    const ts = Number(m.ts) || 0;
    if (ts <= (s.lastPublishTs || 0)) continue;
    if (now - ts > 60 * 1000) continue;
    const lang = k.name.split(':')[1] || '';
    if (!lang) continue;
    confused[lang] = (confused[lang] || 0) + 1;
    if (m.kid) {
      (confusedKids[lang] = confusedKids[lang] || []).push({
        sid: k.name.split(':')[2]?.slice(0, 8) || '',
        avatar: m.avatar || '',
        initial: m.initial || '',
        ts,
      });
    }
  }
  for (const lang of Object.keys(confusedKids)) confusedKids[lang].sort((a, b) => b.ts - a.ts);

  // Understood tallies grouped by utterance id.
  const understood = {};
  const und = await env.SESSION_KV.list({ prefix: 'und:', limit: 1000 });
  for (const k of und.keys) {
    const parts = k.name.split(':'); // und:{ts13}:{sid}
    const id = Number(parts[1]) || 0;
    if (!id) continue;
    const m = k.metadata || {};
    (understood[id] = understood[id] || []).push({
      sid: (parts[2] || '').slice(0, 8),
      avatar: m.avatar || '',
      initial: m.initial || '',
    });
  }

  const payload = { students, byLang, confused, confusedKids, understood, code: s.code };

  // Student message contents are teacher-only.
  const expect = teacherPassword(env);
  if (expect && providedPasscode(request) === expect) {
    const msgs = [];
    const sm = await env.SESSION_KV.list({ prefix: 'smsg:', limit: 100 });
    const recent = sm.keys.slice(-50);
    const vals = await Promise.all(recent.map(k => env.SESSION_KV.get(k.name, 'json')));
    for (const v of vals) if (v) msgs.push(v);
    msgs.sort((a, b) => (a.id || 0) - (b.id || 0));
    payload.messages = msgs;
  }

  return json(payload);
}
