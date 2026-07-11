// POST {code, text, target, passcode} — dispatcher sends a message
// target = 'all' | workerId
// Translates into each target worker's language and caches in KV.
import { json, checkTeacher, cachedTranslate, LANG_CODES, MSG_TTL } from '../_lib.js';

const STALE_MS  = 90_000;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));

  const auth = await checkTeacher(context, body);
  if (!auth.ok) return auth.response;

  const code   = String(body.code   || '').trim().toUpperCase().slice(0, 12);
  const text   = String(body.text   || '').trim().slice(0, 500);
  const target = String(body.target || 'all').trim();
  if (!code || !text) return json({ error: 'Missing fields' }, 400);

  // Determine which languages to translate into
  const now  = Date.now();
  let langs  = [];

  if (target === 'all') {
    const prefix = `ds:${code}:worker:`;
    const res    = await env.SESSION_KV.list({ prefix, limit: 100 });
    const seen   = new Set();
    for (const k of res.keys) {
      const v = await env.SESSION_KV.get(k.name, 'json');
      if (v && now - v.ts < STALE_MS && v.lang && !seen.has(v.lang)) {
        seen.add(v.lang);
        langs.push(v.lang);
      }
    }
  } else {
    const w = await env.SESSION_KV.get(`ds:${code}:worker:${target}`, 'json');
    if (w && w.lang) langs = [w.lang];
  }

  // Translate concurrently
  const translations = {};
  await Promise.all(langs.map(async lang => {
    if (!LANG_CODES[lang] && lang !== 'English') return;
    try {
      translations[lang] = await cachedTranslate(env, text, lang, 10_000);
    } catch (_) {
      translations[lang] = text;
    }
  }));

  const ts     = Date.now();
  const msgKey = `ds:${code}:dmsg:${String(ts).padStart(13, '0')}`;
  await env.SESSION_KV.put(
    msgKey,
    JSON.stringify({ en: text, translations, target, ts }),
    { expirationTtl: MSG_TTL }
  );

  return json({ ok: true, ts });
}
