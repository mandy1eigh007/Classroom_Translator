// /api/studentmsg — student sends a short message to the instructor,
// auto-translated to English. Replaces the Express student-facing /message
// endpoint (the teacher-publish half of /message lives at /api/message).
//
// POST { c, lang, text, nickname?, sessionId } -> { ok: true }
//
// Messages are ephemeral (2h TTL) and the teacher reads them via
// /api/status. The student's sid is stored so the teacher can reply
// (delivered through /api/poll).
import { json, getOrCreateSession, LANG_CODES, openaiChat, translateMyMemory, cooldownOk, clientIp } from './_lib.js';

const MESSAGE_MAX_LEN = 400;
const NICK_MAX_LEN = 40;

async function toEnglish(env, text, sourceLangName) {
  const code = LANG_CODES[sourceLangName];
  if (sourceLangName === 'English' || code === 'en') return text;
  if (env.OPENAI_API_KEY) {
    try {
      const out = await openaiChat(env, {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `Translate the user's text from ${sourceLangName} into English. ` +
              `Reply with ONLY the translated English text — no quotes, no explanation. ` +
              `If the input is already in English, return it unchanged.`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 800,
        temperature: 0,
      }, 15000);
      if (out) return out;
    } catch (_) { /* fall through */ }
  }
  // MyMemory fallback (reverse direction) — best-effort only.
  try {
    if (code && code !== 'en') {
      const params = new URLSearchParams({ q: text, langpair: `${code}|en` });
      if (env.MYMEMORY_EMAIL) params.set('de', env.MYMEMORY_EMAIL.trim());
      const r = await fetch(`https://api.mymemory.translated.net/get?${params}`, { signal: AbortSignal.timeout(15000) });
      const d = await r.json();
      const t = d.responseData && d.responseData.translatedText ? String(d.responseData.translatedText).trim() : '';
      if (t && !/^\s*MYMEMORY WARNING\s*:/i.test(t)) return t;
    }
  } catch (_) {}
  return '';
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!(await cooldownOk(env, 'smsg', clientIp(request), 5))) {
    return json({ error: 'Too many messages — wait a moment' }, 429);
  }
  const body = await request.json().catch(() => ({}));
  const room = String(body.c || '');
  const lang = String(body.lang || '');
  const rawText = String(body.text || '').trim();
  if (!LANG_CODES[lang]) return json({ error: 'Unsupported language' }, 400);
  if (!rawText) return json({ error: 'Empty message' }, 400);

  const s = await getOrCreateSession(env);
  if (room !== s.code) return json({ error: 'Class ended' }, 410);

  const text = rawText.slice(0, MESSAGE_MAX_LEN);
  const nickname = String(body.nickname || '').trim().slice(0, NICK_MAX_LEN) || 'Student';
  const sid = String(body.sessionId || '').slice(0, 64);

  let en = '';
  try { en = await toEnglish(env, text, lang); } catch (_) {}

  const id = Date.now();
  await env.SESSION_KV.put('smsg:' + String(id).padStart(13, '0'), JSON.stringify({
    id, sid, nickname, lang, text, en, ts: id,
  }), { expirationTtl: 60 * 60 * 2 });

  return json({ ok: true });
}
