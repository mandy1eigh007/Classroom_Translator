// /api/teacher/classes — GET list, POST create.
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, pick } from './_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  try {
    const rows = await sb(
      context.env,
      `cl_classes?teacher_id=eq.${auth.user.id}&order=created_at.desc` +
      `&select=*,cl_class_students(student_id)`
    );
    const data = (rows || []).map(c => ({
      ...c,
      student_count: Array.isArray(c.cl_class_students) ? c.cl_class_students.length : 0,
      cl_class_students: undefined,
    }));
    return envelope(data);
  } catch (e) {
    return errResponse(e.message || 'Failed to list classes.', 502);
  }
}

export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const body = await readBody(context.request);
  const fields = pick(body, ['name', 'trade_focus', 'default_source_language', 'status']);
  if (!fields.name || !String(fields.name).trim()) return errResponse('Class name is required.');
  fields.name = String(fields.name).trim();
  try {
    const rows = await sb(context.env, 'cl_classes', {
      method: 'POST',
      body: { ...fields, teacher_id: auth.user.id },
    });
    return envelope(rows && rows[0] ? rows[0] : null, null, 201);
  } catch (e) {
    return errResponse(e.message || 'Failed to create the class.', 502);
  }
}
