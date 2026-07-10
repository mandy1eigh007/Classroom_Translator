// /api/i18n — translate the student UI's own labels into the chosen
// language in a single OpenAI call. Replaces Express /i18n.
//
// POST { lang, c, strings: {key: english} } -> { tr: {key: translated} }
//
// Cached in KV per (lang, hash-of-strings): the string set only changes on
// deploys, so in practice each language is paid for once, ever.
// Env vars: OPENAI_API_KEY.
import { json, getOrCreateSession, LANG_CODES, openaiChat, sha1 } from './_lib.js';

const I18N_TTL = 60 * 60 * 24 * 30;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const lang = String(body.lang || '');
  const room = String(body.c || '');
  const strings = (body && body.strings) || {};

  const s = await getOrCreateSession(env);
  if (room !== s.code) return json({ error: 'Class ended' }, 410);

  const keys = Object.keys(strings).filter(k => typeof strings[k] === 'string').slice(0, 200);
  if (!keys.length) return json({ tr: {} });

  if (lang === 'English' || LANG_CODES[lang] === 'en') {
    const tr = {};
    for (const k of keys) tr[k] = String(strings[k]);
    return json({ tr });
  }
  if (!LANG_CODES[lang]) return json({ error: 'Unsupported language' }, 400);

  const clean = {};
  for (const k of keys) clean[k] = String(strings[k]).slice(0, 400);
  const cacheKey = `i18n:${lang}:${await sha1(JSON.stringify(Object.entries(clean).sort()))}`;
  const hit = await env.SESSION_KV.get(cacheKey, 'json');
  if (hit) return json({ tr: hit });

  if (!env.OPENAI_API_KEY) return json({ tr: clean, fallback: true });

  try {
    const raw = await openaiChat(env, {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `Translate the values in the user's JSON object from English into ${lang}. ` +
            `Return a JSON object with the SAME keys and the translated values. ` +
            `Preserve punctuation, leading/trailing whitespace, and any {placeholder} tokens like {lang} or {n} EXACTLY. ` +
            `Keep translations concise — they are UI labels and button text.`,
        },
        { role: 'user', content: JSON.stringify(clean) },
      ],
      max_tokens: 2000,
      temperature: 0,
    }, 20000);
    let parsed = {};
    try { parsed = JSON.parse(raw); } catch (_) { parsed = {}; }
    const out = {};
    for (const k of keys) {
      const v = parsed[k];
      out[k] = typeof v === 'string' && v ? v : clean[k];
    }
    await env.SESSION_KV.put(cacheKey, JSON.stringify(out), { expirationTtl: I18N_TTL });
    return json({ tr: out });
  } catch (_) {
    return json({ tr: clean, fallback: true });
  }
}
