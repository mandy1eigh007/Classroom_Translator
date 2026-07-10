// /api/translate — translate one English string into a supported language.
// Used by the clients for document pages and video captions (both of which
// are translated lazily, per language, exactly once thanks to the KV cache).
//
// POST { text, lang, c } -> { tr, cached? }
//
// Gated to the active room code so it can't be used as a free anonymous
// translation API. Env vars: OPENAI_API_KEY (MYMEMORY_EMAIL optional).
import { json, getOrCreateSession, LANG_CODES, cachedTranslate } from './_lib.js';

const TEXT_MAX = 6000;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim().slice(0, TEXT_MAX);
  const lang = String(body.lang || '');
  const room = String(body.c || '');
  if (!text) return json({ error: 'Empty text' }, 400);
  if (lang !== 'English' && !LANG_CODES[lang]) return json({ error: 'Unsupported language' }, 400);

  const s = await getOrCreateSession(env);
  if (room !== s.code) return json({ error: 'No active class.' }, 403);

  if (lang === 'English') return json({ tr: text });
  try {
    const tr = await cachedTranslate(env, text, lang, 45000);
    return json({ tr });
  } catch (e) {
    return json({ error: 'Translation failed', tr: text, err: true }, 200);
  }
}
