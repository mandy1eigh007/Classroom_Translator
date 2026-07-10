// /api/tts — natural-voice text-to-speech via OpenAI tts-1 (raw fetch).
// Replaces Express /tts.
//
// POST { text, voice?, room } -> audio/mpeg bytes
//
// Audio is cached in KV (same sentence gets replayed a lot in class).
// Gated to the active room code to deter anonymous cost abuse.
// Env vars: OPENAI_API_KEY.
import { json, getOrCreateSession, sha1, cooldownOk, clientIp } from './_lib.js';

const TTS_MAX_CHARS = 600;
const TTS_TTL = 60 * 60 * 24 * 7;
const VOICES = ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'];

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim().slice(0, TTS_MAX_CHARS);
  const room = String(body.room || '');
  const voice = VOICES.includes(body.voice) ? body.voice : 'nova';
  if (!text) return json({ error: 'Empty text' }, 400);

  const s = await getOrCreateSession(env);
  if (room !== s.code) return json({ error: 'No active class.' }, 403);
  if (!env.OPENAI_API_KEY) return json({ error: 'Natural voice is not available right now.' }, 503);

  const key = `tts:${await sha1(text)}|${voice}`;
  const cached = await env.SESSION_KV.get(key, 'arrayBuffer');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' },
    });
  }

  // Light per-IP throttle only on cache misses (each miss costs real money).
  if (!(await cooldownOk(env, 'tts', clientIp(request), 1))) {
    return json({ error: 'Slow down a moment.' }, 429);
  }

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3' }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw new Error('OpenAI TTS ' + r.status);
    const buf = await r.arrayBuffer();
    context.waitUntil(env.SESSION_KV.put(key, buf, { expirationTtl: TTS_TTL }));
    return new Response(buf, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (_) {
    return json({ error: 'Could not generate audio.' }, 502);
  }
}
