// /api/session — class/session state.
//
// GET  -> { code, active, caps } (public; students + teacher read the
//          current room code here; replaces Express /class/current and
//          /capabilities)
// POST -> teacher actions (Bearer TEACHER_PASSWORD):
//          { action: "check" }  validate passcode (replaces /auth/check)
//          { action: "new" }    rotate room code, wipe lesson state
//                               (replaces /class/new)
//          { action: "clear" }  wipe transcript only, keep the room
//                               (replaces /history/clear)
//          { action: "mode", mode, promptLabel, terms[] }
//                               set the vocabulary mode (General / OSHA /
//                               Trades / Forklift / Flagging / Kindergarten).
//                               Terms come from /public/vocab-presets.js and
//                               are injected into translation prompts.
//
// Env vars used: TEACHER_PASSWORD, OPENAI_API_KEY (capability flags only).
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars in Cloudflare
// Pages settings (future server-side auth verification — not read yet).
import {
  json, getOrCreateSession, putSession, checkTeacher, genRoomCode,
  readTranscript, SNAPSHOT_TTL,
} from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    const s = await getOrCreateSession(env);
    return json({
      code: s.code,
      active: true,
      mode: s.mode || 'general',
      caps: {
        tts: !!env.OPENAI_API_KEY,
        whisper: !!env.OPENAI_API_KEY,
        phrasebookSync: !!env.PHRASEBOOK_KV,
      },
    });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const auth = await checkTeacher(context, body);
  if (!auth.ok) {
    // /auth/check parity: a wrong passcode on "check" answers ok:false with
    // 200 unless the IP is locked out.
    if (body.action === 'check' && auth.response.status === 401) return json({ ok: false });
    return auth.response;
  }

  const action = String(body.action || '');
  if (action === 'check') return json({ ok: true });

  const s = await getOrCreateSession(env);

  if (action === 'new') {
    // Snapshot the just-ended class transcript so students who still have
    // the old link can generate final notes for a few minutes (parity with
    // the Express previousClassSnapshot behavior).
    try {
      const { transcript, count, durationMs } = await readTranscript(env, s.epoch);
      if (transcript.length >= 40) {
        await env.SESSION_KV.put('snapshot:' + s.code, JSON.stringify({
          transcript: transcript.slice(-60000), count, durationMs, endedAt: Date.now(),
        }), { expirationTtl: SNAPSHOT_TTL });
      }
    } catch (_) { /* snapshot is best-effort */ }

    const next = {
      code: genRoomCode(),
      epoch: s.epoch + 1,          // hides all old msg/tr keys instantly
      latestTs: 0,
      lastPublishTs: 0,
      videoV: s.videoV + 1,
      docV: s.docV + 1,
      replyV: s.replyV + 1,
      startedAt: Date.now(),
      // The vocabulary mode is a teacher preference — keep it across classes.
      mode: s.mode || 'general',
      modePrompt: s.modePrompt || '',
      modeTerms: s.modeTerms || [],
    };
    await putSession(env, next);
    // Clear shared media state (old keys for msgs/translations expire on TTL).
    await Promise.all([
      env.SESSION_KV.delete('video:state'),
      env.SESSION_KV.delete('video:cues'),
      env.SESSION_KV.delete('doc:meta'),
    ]);
    return json({ code: next.code });
  }

  if (action === 'clear') {
    s.epoch += 1;
    s.latestTs = 0;
    s.lastPublishTs = Date.now();
    await putSession(env, s);
    return json({ ok: true });
  }

  if (action === 'mode') {
    const mode = String(body.mode || 'general').toLowerCase();
    if (!/^[a-z0-9_-]{1,24}$/.test(mode)) return json({ error: 'Bad mode' }, 400);
    s.mode = mode;
    s.modePrompt = String(body.promptLabel || '').slice(0, 120);
    s.modeTerms = Array.isArray(body.terms)
      ? body.terms.slice(0, 60).map(t => String(t).slice(0, 80))
      : [];
    await putSession(env, s);
    return json({ ok: true, mode: s.mode });
  }

  return json({ error: 'Unknown action' }, 400);
}
