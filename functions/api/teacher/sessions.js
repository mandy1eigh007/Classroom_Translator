// /api/teacher/sessions — GET list, POST create (new lobby session).
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, isUuid, genSessionCode } from './_auth.js';

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

// Body: { class_id? } — creates a lobby session with a fresh join code.
export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const body = await readBody(context.request);
  const classId = body && body.class_id ? body.class_id : null;
  if (classId && !isUuid(classId)) return errResponse('Invalid class id.');
  try {
    if (classId) {
      const owned = await sb(context.env, `cl_classes?id=eq.${classId}&teacher_id=eq.${auth.user.id}&select=id`);
      if (!owned || !owned[0]) return errResponse('Class not found.', 404);
    }
    // Retry on the (unlikely) chance a random code collides with the unique index.
    let session = null;
    let lastErr = null;
    for (let i = 0; i < 3 && !session; i++) {
      try {
        const rows = await sb(context.env, 'cl_sessions', {
          method: 'POST',
          body: {
            teacher_id: auth.user.id,
            class_id: classId,
            session_code: genSessionCode(),
            status: 'lobby',
            started_at: new Date().toISOString(),
          },
        });
        session = rows && rows[0];
      } catch (e) { lastErr = e; }
    }
    if (!session) return errResponse((lastErr && lastErr.message) || 'Failed to create the session.', 502);

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
