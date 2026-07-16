import { envelope, errResponse } from '../teacher/_auth.js';
import { runScheduledMining } from '../_video_mining.js';

export async function onRequestPost(context) {
  const expected = context.env.MINER_CRON_SECRET || '';
  const auth = context.request.headers.get('Authorization') || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!expected) return errResponse('Scheduled mining is not configured.', 503);
  if (!provided || !(await sameSecret(provided, expected))) return errResponse('Unauthorized.', 401);
  try { return envelope(await runScheduledMining(context.env)); }
  catch (error) { return errResponse(error.message || 'Scheduled mining failed.', error.status || 500); }
}

async function sameSecret(left, right) {
  const values = await Promise.all([left, right].map(value =>
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
  const a = new Uint8Array(values[0]);
  const b = new Uint8Array(values[1]);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
