// GET ?code=XYZ — returns currently-live workers (heartbeat within 90s)
import { json } from '../_lib.js';

const STALE_MS = 90_000;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const url  = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  if (!code) return json({ error: 'Missing code' }, 400);

  const prefix = `ds:${code}:worker:`;
  const res    = await env.SESSION_KV.list({ prefix, limit: 100 });
  const now    = Date.now();
  const workers = [];

  for (const k of res.keys) {
    const workerId = k.name.slice(prefix.length);
    const v = await env.SESSION_KV.get(k.name, 'json');
    if (v && now - v.ts < STALE_MS) {
      workers.push({ workerId, name: v.name, lang: v.lang, ts: v.ts });
    }
  }
  return json({ workers });
}
