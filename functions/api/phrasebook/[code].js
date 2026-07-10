// /api/phrasebook/{code} — cross-device phrasebook sync. Replaces the
// Express /phrasebook/:code endpoints (Replit DB -> PHRASEBOOK_KV).
//
// GET  -> { items: [...], updatedAt }
// PUT  -> { items: [...] }  (also accepts POST for older clients)
//
// The code is a student-invented nickname (no accounts). Data is a small
// vocab list — no PII beyond what the student typed themselves.
import { json } from '../_lib.js';

const PB_MAX_ITEMS = 500;
const PB_MAX_BYTES = 64 * 1024;
const PB_CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;

export async function onRequest(context) {
  const { request, env, params } = context;
  if (!env.PHRASEBOOK_KV) return json({ error: 'Sync is not configured on this server.' }, 503);
  const code = String(params.code || '');
  if (!PB_CODE_RE.test(code)) return json({ error: 'Invalid sync code.' }, 400);
  const key = 'pb:' + code;

  if (request.method === 'GET') {
    const parsed = await env.PHRASEBOOK_KV.get(key, 'json');
    if (!parsed) return json({ items: [], updatedAt: 0 });
    return json({
      items: Array.isArray(parsed.items) ? parsed.items : [],
      updatedAt: parsed.updatedAt || 0,
    });
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : null;
    if (!items) return json({ error: 'Missing items[].' }, 400);
    const clean = items.slice(0, PB_MAX_ITEMS).map(it => ({
      en: String((it && it.en) || '').slice(0, 400),
      tr: String((it && it.tr) || '').slice(0, 400),
      kind: String((it && it.kind) || 'phrase').slice(0, 16),
      ts: Number(it && it.ts) || Date.now(),
    }));
    const payload = JSON.stringify({ items: clean, updatedAt: Date.now() });
    if (new TextEncoder().encode(payload).length > PB_MAX_BYTES) {
      return json({ error: 'Phrasebook too large.' }, 413);
    }
    await env.PHRASEBOOK_KV.put(key, payload);
    return json({ ok: true, count: clean.length });
  }

  return json({ error: 'Method not allowed' }, 405);
}
