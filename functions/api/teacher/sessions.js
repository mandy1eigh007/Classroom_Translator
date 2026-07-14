// /api/teacher/sessions — GET list, POST create (new lobby session).
//
// POST rotates the shared /teach room in SESSION_KV (same semantics as
// POST /api/session {action:"new"}) and stores THAT code in
// cl_sessions.session_code, so the dashboard record and the live class
// share one join code and can never diverge.
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, isUuid } from './_auth.js';
import { getOrCreateSession, putSession, genRoomCode, readTranscript, SNAPSHOT_TTL } from '../_lib.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  try {
    const rows = await sb(
      context.env,
      `cl_sessions?teacher_id=eq.${auth.user.id}&order=created_at.desc&limit=50` +
      `&select=*,cl_classes(id,name),cl_session_attendees(id,preferred_language,help_flag)`
    );
    const data = (rows || []).map(s => ({
      ...s,
      class_name: s.cl_classes ? s.cl_classes.name : null,
      student_count: Array.isArray(s.cl_session_attendees) ? s.cl_session_attendees.length : 0,
      languages: [...new Set((s.cl_session_attendees || []).map(a => a.preferred_language))],
      cl_classes: undefined,
      cl_session_attendees: undefined,
    }));
    return envelope(data);
  } catch (e) {
    return errResponse(e.message || 'Failed to list sessions.', 502);
  }
}

// Body: { class_id? } — creates a lobby session whose join code IS the live
// /teach room code (the dashboard redirects to /teach, which reads the same
// code back from GET /api/session).
export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const { env } = context;
  const body = await readBody(context.request);
  const classId = body && body.class_id ? body.class_id : null;
  if (classId && !isUuid(classId)) return errResponse('Invalid class id.');
  try {
    if (classId) {
      const owned = await sb(env, `cl_classes?id=eq.${classId}&teacher_id=eq.${auth.user.id}&select=id`);
      if (!owned || !owned[0]) return errResponse('Class not found.', 404);
    }

    // Snapshot the outgoing room's transcript first (parity with
    // /api/session {action:"new"}) so students still on the old link can
    // generate final notes for a few minutes.
    const prev = await getOrCreateSession(env);
    try {
      const { transcript, count, durationMs } = await readTranscript(env, prev.epoch);
      if (transcript.length >= 40) {
        await env.SESSION_KV.put('snapshot:' + prev.code, JSON.stringify({
          transcript: transcript.slice(-60000), count, durationMs, endedAt: Date.now(),
        }), { expirationTtl: SNAPSHOT_TTL });
      }
    } catch (_) { /* snapshot is best-effort */ }

    const room = {
      code: genRoomCode(),
      epoch: prev.epoch + 1,          // hides all old msg/tr keys instantly
      latestTs: 0,
      lastPublishTs: 0,
      videoV: (prev.videoV || 0) + 1,
      docV: (prev.docV || 0) + 1,
      replyV: (prev.replyV || 0) + 1,
      startedAt: Date.now(),
      // The vocabulary mode is a teacher preference — keep it across classes.
      mode: prev.mode || 'general',
      modePrompt: prev.modePrompt || '',
      modeTerms: prev.modeTerms || [],
    };

    // Insert the Supabase record with the SAME code. session_code is unique;
    // on the (unlikely) collision, re-roll and try again — the room is only
    // published to KV after the record exists, so they stay in sync.
    let session = null;
    let lastErr = null;
    for (let i = 0; i < 3 && !session; i++) {
      if (i > 0) room.code = genRoomCode();
      try {
        const rows = await sb(env, 'cl_sessions', {
          method: 'POST',
          body: {
            teacher_id: auth.user.id,
            class_id: classId,
            session_code: room.code,
            status: 'lobby',
            started_at: new Date().toISOString(),
          },
        });
        session = rows && rows[0];
      } catch (e) { lastErr = e; }
    }
    if (!session) return errResponse((lastErr && lastErr.message) || 'Failed to create the session.', 502);

    // Publish the rotated room to KV — /teach and /student pick it up from
    // GET /api/session. Clear shared media state from the previous room.
    await putSession(env, room);
    await Promise.all([
      env.SESSION_KV.delete('video:state'),
      env.SESSION_KV.delete('video:cues'),
      env.SESSION_KV.delete('doc:meta'),
    ]).catch(() => {});

    await sb(context.env, 'cl_session_events', {
      method: 'POST',
      body: { session_id: session.id, event_type: 'session_started', payload: { class_id: classId } },
      prefer: 'return=minimal',
    }).catch(() => {});
    if (classId) {
      await sb(context.env, `cl_classes?id=eq.${classId}`, {
        method: 'PATCH',
        body: { last_session_at: new Date().toISOString() },
        prefer: 'return=minimal',
      }).catch(() => {});
    }
    return envelope(session, null, 201);
  } catch (e) {
    return errResponse(e.message || 'Failed to create the session.', 502);
  }
}
