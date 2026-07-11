// GET ?code&workerId&lang&since — worker polls for messages
// GET ?code&since (no workerId) — dispatcher polls for responses
import { json } from '../_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const url      = new URL(request.url);
  const code     = (url.searchParams.get('code')     || '').trim().toUpperCase();
  const workerId = (url.searchParams.get('workerId') || '').trim();
  const lang     = (url.searchParams.get('lang')     || '').trim();
  const since    = Number(url.searchParams.get('since') || '0');
  if (!code) return json({ error: 'Missing code' }, 400);

  if (workerId) {
    // Worker: fetch messages addressed to them or 'all'
    const prefix = `ds:${code}:dmsg:`;
    const res    = await env.SESSION_KV.list({ prefix, limit: 100 });
    const messages = [];
    for (const k of res.keys) {
      const ts = Number(k.name.slice(prefix.length)) || 0;
      if (ts <= since) continue;
      const v = await env.SESSION_KV.get(k.name, 'json');
      if (!v) continue;
      if (v.target !== 'all' && v.target !== workerId) continue;
      const tr = v.translations?.[lang] ?? v.en;
      messages.push({ ts: v.ts, en: v.en, tr, target: v.target });
    }
    messages.sort((a, b) => a.ts - b.ts);
    return json({ messages });
  }

  // Dispatcher: fetch worker responses
  const prefix = `ds:${code}:dresp:`;
  const res    = await env.SESSION_KV.list({ prefix, limit: 200 });
  const responses = [];
  for (const k of res.keys) {
    const ts = Number(k.name.slice(prefix.length)) || 0;
    if (ts <= since) continue;
    const v = await env.SESSION_KV.get(k.name, 'json');
    if (v) responses.push(v);
  }
  responses.sort((a, b) => a.ts - b.ts);
  return json({ responses });
}
