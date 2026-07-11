// POST {code, workerId, name, lang} — worker registers / heartbeat
import { json } from '../_lib.js';

const WORKER_TTL = 90;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const code      = String(body.code     || '').trim().toUpperCase().slice(0, 12);
  const workerId  = String(body.workerId || '').trim().slice(0, 64);
  const name      = String(body.name     || '').trim().slice(0, 40);
  const lang      = String(body.lang     || '').trim().slice(0, 30);
  if (!code || !workerId || !name || !lang) return json({ error: 'Missing fields' }, 400);

  await env.SESSION_KV.put(
    `ds:${code}:worker:${workerId}`,
    JSON.stringify({ name, lang, ts: Date.now() }),
    { expirationTtl: WORKER_TTL }
  );
  return json({ ok: true });
}
