// /api/teacher/students — GET list, POST create (single or roster import).
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, isUuid } from './_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  try {
    const rows = await sb(
      context.env,
      `cl_students?teacher_id=eq.${auth.user.id}&order=name.asc` +
      `&select=*,cl_class_students(class_id,cl_classes(id,name))`
    );
    const data = (rows || []).map(s => ({
      ...s,
      classes: (s.cl_class_students || [])
        .map(cs => cs.cl_classes)
        .filter(Boolean),
      cl_class_students: undefined,
    }));
    return envelope(data);
  } catch (e) {
    return errResponse(e.message || 'Failed to list students.', 502);
  }
}

// Body: { name, preferred_language, class_id? }
//   or  { students: [{ name, preferred_language }...], class_id? }  (roster import)
export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const body = await readBody(context.request);
  if (!body) return errResponse('Missing request body.');

  const list = Array.isArray(body.students)
    ? body.students
    : [{ name: body.name, preferred_language: body.preferred_language }];
  const clean = list
    .map(s => ({
      teacher_id: auth.user.id,
      name: String((s && s.name) || '').trim(),
      preferred_language: String((s && s.preferred_language) || body.preferred_language || 'es').trim() || 'es',
    }))
    .filter(s => s.name);
  if (!clean.length) return errResponse('At least one student name is required.');
  if (clean.length > 200) return errResponse('Too many students in one import (max 200).');

  const classId = body.class_id;
  if (classId !== undefined && classId !== null && classId !== '' && !isUuid(classId)) {
    return errResponse('Invalid class id.');
  }

  try {
    if (classId) {
      const owned = await sb(context.env, `cl_classes?id=eq.${classId}&teacher_id=eq.${auth.user.id}&select=id`);
      if (!owned || !owned[0]) return errResponse('Class not found.', 404);
    }
    const rows = await sb(context.env, 'cl_students', { method: 'POST', body: clean });
    if (classId && rows && rows.length) {
      await sb(context.env, 'cl_class_students', {
        method: 'POST',
        body: rows.map(r => ({ class_id: classId, student_id: r.id })),
        prefer: 'return=minimal,resolution=merge-duplicates',
      });
    }
    return envelope(rows || [], null, 201);
  } catch (e) {
    return errResponse(e.message || 'Failed to add students.', 502);
  }
}
