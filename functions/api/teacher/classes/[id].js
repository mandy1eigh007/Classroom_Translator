// /api/teacher/classes/:id — GET, PUT, DELETE a single class.
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, pick, isUuid } from '../_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid class id.');
  try {
    const rows = await sb(
      context.env,
      `cl_classes?id=eq.${id}&teacher_id=eq.${auth.user.id}` +
      `&select=*,cl_class_students(student_id,enrolled_at,cl_students(id,name,preferred_language,last_active_at))`
    );
    if (!rows || !rows[0]) return errResponse('Class not found.', 404);
    return envelope(rows[0]);
  } catch (e) {
    return errResponse(e.message || 'Failed to load the class.', 502);
  }
}

export async function onRequestPut(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid class id.');
  const body = await readBody(context.request);
  const fields = pick(body, ['name', 'trade_focus', 'default_source_language', 'status', 'last_session_at']);
  if (!Object.keys(fields).length) return errResponse('Nothing to update.');
  try {
    const rows = await sb(context.env, `cl_classes?id=eq.${id}&teacher_id=eq.${auth.user.id}`, {
      method: 'PATCH',
      body: fields,
    });
    if (!rows || !rows[0]) return errResponse('Class not found.', 404);
    return envelope(rows[0]);
  } catch (e) {
    return errResponse(e.message || 'Failed to update the class.', 502);
  }
}

export async function onRequestDelete(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid class id.');
  try {
    // Confirm ownership before touching roster links.
    const owned = await sb(context.env, `cl_classes?id=eq.${id}&teacher_id=eq.${auth.user.id}&select=id`);
    if (!owned || !owned[0]) return errResponse('Class not found.', 404);
    // Clear roster links first, then the class itself. Classes referenced by
    // materials or sessions will refuse to delete — archive those instead.
    await sb(context.env, `cl_class_students?class_id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' });
    const rows = await sb(context.env, `cl_classes?id=eq.${id}&teacher_id=eq.${auth.user.id}`, {
      method: 'DELETE',
    });
    return envelope(rows && rows[0] ? rows[0] : { id });
  } catch (e) {
    return errResponse(e.message || 'Could not delete — archive the class instead if it has sessions or materials.', 409);
  }
}
