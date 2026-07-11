// POST {code, workerId, name, response} — worker sends a canned response
import { json, MSG_TTL } from '../_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body     = await request.json().catch(() => ({}));
  const code     = String(body.code     || '').trim().toUpperCase().slice(0, 12);
  const workerId = String(body.workerId || '').trim().slice(0, 64);
  const name     = String(body.name     || '').trim().slice(0, 40);
  const response = String(body.response || '').trim().slice(0, 30);
  if (!code || !workerId || !name || !response) return json({ error: 'Missing fields' }, 400);

  const ts  = Date.now();
  const key = `ds:${code}:dresp:${String(ts).padStart(13, '0')}`;
  await env.SESSION_KV.put(
    key,
    JSON.stringify({ workerId, name, response, ts }),
    { expirationTtl: MSG_TTL }
  );
  return json({ ok: true });
}
