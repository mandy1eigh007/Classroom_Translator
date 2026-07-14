// GET /api/teacher — health check + logged-in teacher context.
import { requireTeacher, envelope, errResponse, corsPreflight, sb } from './_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const { user, profile } = auth;
  try {
    const sessions = await sb(
      context.env,
      `cl_sessions?teacher_id=eq.${user.id}&status=neq.ended&order=created_at.desc&limit=1&select=*`
    );
    return envelope({
      ok: true,
      teacher: {
        id: user.id,
        email: user.email || profile.email || null,
        display_name: profile.display_name || null,
        organization_id: profile.organization_id || null,
      },
      active_session: (sessions && sessions[0]) || null,
    });
  } catch (e) {
    return errResponse(e.message || 'Failed to load teacher context.', 502);
  }
}
