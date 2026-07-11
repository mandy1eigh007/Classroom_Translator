// ClassLingo — shared helpers for Cloudflare Pages Functions.
// Files prefixed with "_" are not routed by Pages; this is import-only.
//
// Environment variables (set in Cloudflare Pages -> Settings -> Environment
// variables):
//   OPENAI_API_KEY    - OpenAI API key (translation, notes, TTS, Whisper, OCR)
//   TEACHER_PASSWORD  - instructor login password (TEACHER_PASSCODE also
//                       accepted for continuity with the old Replit deploy)
//   MYMEMORY_EMAIL    - optional; contact email for the MyMemory fallback
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars in Cloudflare
// Pages settings for the upcoming server-side Supabase Auth verification
// (JWT check against auth.users). Client pages talk to Supabase directly
// with the anon key for now; nothing here reads these vars yet.
//
// KV bindings:
//   SESSION_KV     - live class state, messages, translation cache
//   PHRASEBOOK_KV  - student phrasebook sync
//
// Design note (SSE -> KV polling): Workers are stateless, so the old
// Express in-memory subscriber model is replaced by:
//   - session doc      key "session:current" (single JSON blob; the teacher
//                      is the only writer, so read-modify-write is safe)
//   - messages         key "msg:{epoch}:{ts13}" — value+metadata carry the
//                      English text; students poll for keys newer than their
//                      last-seen timestamp
//   - translations     key "tr:{epoch}:{ts13}:{lang}" — computed on first
//                      demand, cached for everyone else in that language
// "Clearing history" and "new class" bump the epoch, which makes every old
// msg/tr key invisible without needing deletes. Keys carry TTLs so KV
// self-cleans (ephemeral by design — no student PII, nothing kept).

export const LANG_CODES = {
  'English': 'en',
  'Spanish': 'es',
  'Dari': 'fa',
  'Somali': 'so',
  'Vietnamese': 'vi',
  'Amharic': 'am',
  'Arabic': 'ar',
  'Simplified Chinese': 'zh-CN',
  'Tagalog': 'tl',
  'Swahili': 'sw',
  'French': 'fr',
  'Portuguese': 'pt',
  'Korean': 'ko',
  'Hindi': 'hi',
  'Punjabi': 'pa',
  'Russian': 'ru',
  'Ukrainian': 'uk',
  'Haitian Creole': 'ht',
  'Pashto': 'ps',
  'Burmese': 'my',
  'Khmer': 'km',
  'Hmong': 'hmn',
  'Tigrinya': 'ti',
  'Karen (Sgaw)': 'ksw',
  'Nepali': 'ne',
  'Malay': 'ms',
  'Turkish': 'tr',
};

export const MSG_TTL = 60 * 60 * 12;      // messages live 12h max
export const TR_TTL = 60 * 60 * 12;       // cached translations follow
export const SNAPSHOT_TTL = 60 * 10;      // final-notes window after class end
export const NOTES_PER_CLASS_CAP = 8;

export function json(data, status = 200, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export function pad13(n) {
  return String(n).padStart(13, '0');
}

export async function sha1(text) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export function genRoomCode() {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  return [...buf].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ---------- session doc ----------
// { code, epoch, latestTs, lastPublishTs, videoV, docV, replyV, startedAt }
export async function getSession(env) {
  return env.SESSION_KV.get('session:current', 'json');
}

export async function putSession(env, session) {
  await env.SESSION_KV.put('session:current', JSON.stringify(session));
}

export async function getOrCreateSession(env) {
  let s = await getSession(env);
  if (!s) {
    s = {
      code: genRoomCode(),
      epoch: 1,
      latestTs: 0,
      lastPublishTs: 0,
      videoV: 0,
      docV: 0,
      replyV: 0,
      startedAt: Date.now(),
    };
    await putSession(env, s);
  }
  return s;
}

// ---------- instructor auth ----------
// Bearer token compared against TEACHER_PASSWORD (or legacy TEACHER_PASSCODE).
// Per-IP brute-force lockout: 5 failures in 10 min -> locked 10 min. Stored
// in KV with a TTL so it self-expires.
const AUTH_MAX_FAILS = 5;
const AUTH_WINDOW_S = 600;

export function teacherPassword(env) {
  return (env.TEACHER_PASSWORD || env.TEACHER_PASSCODE || '').trim();
}

export function providedPasscode(request, body) {
  const h = request.headers.get('Authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  if (body && typeof body.passcode === 'string') return body.passcode.trim();
  return '';
}

// Returns { ok } or { ok:false, response } (response ready to return).
export async function checkTeacher(context, body) {
  const { request, env } = context;
  const expect = teacherPassword(env);
  if (!expect) {
    return { ok: false, response: json({ error: 'TEACHER_PASSWORD is not configured on the server.' }, 503) };
  }
  const ip = clientIp(request);
  const failKey = 'authfail:' + ip;
  const rec = await env.SESSION_KV.get(failKey, 'json');
  if (rec && rec.count >= AUTH_MAX_FAILS) {
    return { ok: false, response: json({ error: 'Too many attempts. Try again later.', locked: true }, 429, { 'Retry-After': String(AUTH_WINDOW_S) }) };
  }
  const provided = providedPasscode(request, body);
  if (!provided || provided !== expect) {
    const next = { count: ((rec && rec.count) || 0) + 1 };
    await env.SESSION_KV.put(failKey, JSON.stringify(next), { expirationTtl: AUTH_WINDOW_S });
    return { ok: false, response: json({ error: 'Bad passcode' }, 401) };
  }
  return { ok: true };
}

// ---------- OpenAI (raw fetch, no SDK) ----------
export async function openaiChat(env, payload, timeoutMs = 20000) {
  if (!env.OPENAI_API_KEY) throw new Error('OpenAI not configured');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`OpenAI ${r.status}: ${t.slice(0, 200)}`);
  }
  const data = await r.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// Mode context — set by the instructor's mode selector (teach.html ->
// POST /api/session {action:"mode"}) and stored on the session doc. When a
// trade/safety mode is active the term list is injected into the system
// prompt so specialized vocabulary translates with correct terminology.
export function modeCtxFrom(session) {
  if (!session || !session.mode || session.mode === 'general') return null;
  return {
    mode: session.mode,
    prompt: session.modePrompt || session.mode,
    terms: Array.isArray(session.modeTerms) ? session.modeTerms : [],
  };
}

export async function translateOpenAI(env, text, langName, timeoutMs = 15000, modeCtx = null) {
  let system =
    `Translate the user's English text into ${langName}. ` +
    `Reply with ONLY the translated text — no quotes, no explanation, no language tags, no transliteration. ` +
    `Preserve punctuation, capitalization style, numbers, and proper nouns. ` +
    `If the input is already in ${langName} or untranslatable (e.g. a URL, a number alone), return it unchanged.`;
  if (modeCtx) {
    system =
      `You are translating for a ${modeCtx.prompt} training class. ` +
      `Use accurate trade terminology in ${langName}.` +
      (modeCtx.terms.length ? ` Key terms: ${modeCtx.terms.join(', ')}.` : '') +
      ' ' + system;
  }
  const out = await openaiChat(env, {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: text },
    ],
    max_tokens: 4000,
    temperature: 0,
  }, timeoutMs);
  if (!out) throw new Error('Empty translation from OpenAI');
  return out;
}

// ---------- MyMemory fallback (free, no key) ----------
const MAX_CHUNK = 480;
function chunkText(text) {
  const clean = String(text || '').trim();
  if (!clean) return [];
  if (clean.length <= MAX_CHUNK) return [clean];
  const parts = [];
  let buf = '';
  for (const piece of clean.split(/(?<=[.!?])\s+|,\s+/)) {
    const p = piece.trim();
    if (!p) continue;
    if ((buf + ' ' + p).trim().length <= MAX_CHUNK) { buf = (buf ? buf + ' ' : '') + p; continue; }
    if (buf) { parts.push(buf); buf = ''; }
    if (p.length > MAX_CHUNK) {
      for (let i = 0; i < p.length; i += MAX_CHUNK) parts.push(p.slice(i, i + MAX_CHUNK));
    } else buf = p;
  }
  if (buf) parts.push(buf);
  return parts;
}

async function translateChunkMyMemory(env, text, langCode, timeoutMs) {
  const params = new URLSearchParams({ q: text, langpair: `en|${langCode}` });
  if (env.MYMEMORY_EMAIL) params.set('de', env.MYMEMORY_EMAIL.trim());
  const r = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await r.json();
  if (Number(data.responseStatus) !== 200) throw new Error(data.responseDetails || 'Translation failed');
  const t = data.responseData && data.responseData.translatedText
    ? String(data.responseData.translatedText).trim() : '';
  if (!t) throw new Error('No translation returned');
  if (/^\s*MYMEMORY WARNING\s*:/i.test(t)) throw new Error('MyMemory quota exhausted');
  return t;
}

export async function translateMyMemory(env, text, langCode, timeoutMs = 15000) {
  const chunks = chunkText(text);
  const out = [];
  let anyOk = false, lastErr = null;
  for (const c of chunks) {
    try { out.push(await translateChunkMyMemory(env, c, langCode, timeoutMs)); anyOk = true; }
    catch (e) { lastErr = e; out.push(c); }
  }
  if (!anyOk) throw lastErr || new Error('MyMemory failed');
  return out.join(' ');
}

// OpenAI first, MyMemory fallback. English passes through.
export async function translateAll(env, text, langName, timeoutMs = 15000, modeCtx = null) {
  const code = LANG_CODES[langName];
  if (langName === 'English' || code === 'en') return text;
  if (!code) throw new Error('Unsupported language');
  if (env.OPENAI_API_KEY) {
    try { return await translateOpenAI(env, text, langName, timeoutMs, modeCtx); }
    catch (_) { /* fall through */ }
  }
  return translateMyMemory(env, text, code, timeoutMs);
}

// KV-cached translation keyed by content hash — shared by live utterances,
// doc pages, and video captions so a sentence is only ever paid for once
// per language regardless of how many students ask for it. The active mode
// is part of the cache key so OSHA-mode translations never leak into a
// general class (and vice versa).
export async function cachedTranslate(env, text, langName, timeoutMs = 15000, modeCtx = null) {
  if (langName === 'English') return text;
  const modeSuffix = modeCtx && modeCtx.mode ? `:${modeCtx.mode}` : '';
  const key = `trh:${await sha1(text)}:${langName}${modeSuffix}`;
  const hit = await env.SESSION_KV.get(key);
  if (hit != null) return hit;
  const tr = await translateAll(env, text, langName, timeoutMs, modeCtx);
  await env.SESSION_KV.put(key, tr, { expirationTtl: TR_TTL });
  return tr;
}

// ---------- transcript (for notes / study sheet) ----------
// Reconstructs the English transcript by listing msg keys for the current
// epoch. Message text rides in key metadata when it fits (<= ~900 bytes),
// with a value fallback for long utterances.
export async function readTranscript(env, epoch) {
  const prefix = `msg:${epoch}:`;
  const texts = [];
  let cursor;
  let firstTs = 0, lastTs = 0, count = 0;
  for (let page = 0; page < 5; page++) {
    const res = await env.SESSION_KV.list({ prefix, cursor, limit: 1000 });
    for (const k of res.keys) {
      const ts = Number(k.name.slice(prefix.length)) || 0;
      if (!firstTs) firstTs = ts;
      lastTs = ts;
      count++;
      if (k.metadata && typeof k.metadata.en === 'string') {
        texts.push(k.metadata.en);
      } else {
        const v = await env.SESSION_KV.get(k.name);
        if (v) texts.push(v);
      }
    }
    if (res.list_complete) break;
    cursor = res.cursor;
  }
  return { transcript: texts.join(' ').trim(), count, durationMs: Math.max(0, lastTs - firstTs) };
}

// ---------- misc ----------
export function escHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Lightweight per-IP cooldown backed by KV (used only on the expensive
// endpoints — every check costs a read; passing costs a write). KV's
// minimum TTL is 60s, so the key stores a timestamp and we compare against
// `seconds` ourselves.
export async function cooldownOk(env, bucket, ip, seconds) {
  const key = `cool:${bucket}:${ip}`;
  const last = Number(await env.SESSION_KV.get(key)) || 0;
  if (Date.now() - last < seconds * 1000) return false;
  await env.SESSION_KV.put(key, String(Date.now()), { expirationTtl: Math.max(60, seconds) });
  return true;
}
