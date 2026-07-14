// /api/teacher/sessions/:id — GET session + attendees + events;
// PUT to change status (activate / end).
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, isUuid } from '../_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid session id.');
  try {
    const rows = await sb(
      context.env,
      `cl_sessions?id=eq.${id}&teacher_id=eq.${auth.user.id}` +
      `&select=*,cl_classes(id,name),` +
      `cl_session_attendees(id,student_id,guest_name,preferred_language,joined_at,last_seen_at,help_flag,help_flagged_at,cl_students(id,name)),` +
      `cl_session_events(id,event_type,payload,created_at)`
    );
    if (!rows || !rows[0]) return errResponse('Session not found.', 404);
    const s = rows[0];
    return envelope({
      ...s,
      class_name: s.cl_classes ? s.cl_classes.name : null,
      attendees: (s.cl_session_attendees || []).map(a => ({
        ...a,
        name: (a.cl_students && a.cl_students.name) || a.guest_name || 'Guest',
        cl_students: undefined,
      })),
      events: (s.cl_session_events || []).sort((a, b) => (a.created_at < b.created_at ? -1 : 1)),
      cl_classes: undefined,
      cl_session_attendees: undefined,
      cl_session_events: undefined,
    });
  } catch (e) {
    return errResponse(e.message || 'Failed to load the session.', 502);
  }
}

// Body: { status: "active" | "ended" }
export async function onRequestPut(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid session id.');
  const body = await readBody(context.request);
  const status = body && body.status;
  if (!['lobby', 'active', 'ended'].includes(status)) {
    return errResponse('status must be lobby, active, or ended.');
  }
  const fields = { status };
  if (status === 'ended') fields.ended_at = new Date().toISOString();
  try {
    const rows = await sb(context.env, `cl_sessions?id=eq.${id}&teacher_id=eq.${auth.user.id}`, {
      method: 'PATCH',
      body: fields,
    });
    if (!rows || !rows[0]) return errResponse('Session not found.', 404);
    if (status === 'ended') {
      await sb(context.env, 'cl_session_events', {
        method: 'POST',
        body: { session_id: id, event_type: 'session_ended', payload: null },
        prefer: 'return=minimal',
      }).catch(() => {});
    }
    return envelope(rows[0]);
  } catch (e) {
    return errResponse(e.message || 'Failed to update the session.', 502);
  }
}
