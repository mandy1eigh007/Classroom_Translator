// /api/teacher/materials — GET list (optional ?class_id=), POST create.
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, pick, isUuid } from './_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const url = new URL(context.request.url);
  const classId = url.searchParams.get('class_id');
  if (classId && !isUuid(classId)) return errResponse('Invalid class id.');
  try {
    let path =
      `cl_materials?teacher_id=eq.${auth.user.id}&order=created_at.desc` +
      `&select=*,cl_material_subjects(id,name),cl_material_translations(target_language,translation_status,updated_at)`;
    if (classId) path += `&class_id=eq.${classId}`;
    const rows = await sb(context.env, path);
    return envelope(rows || []);
  } catch (e) {
    return errResponse(e.message || 'Failed to list materials.', 502);
  }
}

export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const body = await readBody(context.request);
  const fields = pick(body, [
    'class_id', 'subject_id', 'category', 'lesson', 'title',
    'material_type', 'source_language', 'content', 'is_published',
  ]);
  if (!fields.title || !String(fields.title).trim()) return errResponse('Material title is required.');
  fields.title = String(fields.title).trim();
  if (fields.class_id && !isUuid(fields.class_id)) return errResponse('Invalid class id.');
  if (fields.subject_id && !isUuid(fields.subject_id)) return errResponse('Invalid subject id.');
  // Accept a subject by name — create/reuse a cl_material_subjects row.
  const subjectName = body && typeof body.subject_name === 'string' ? body.subject_name.trim() : '';
  try {
    if (!fields.subject_id && subjectName) {
      const existing = await sb(
        context.env,
        `cl_material_subjects?teacher_id=eq.${auth.user.id}&name=eq.${encodeURIComponent(subjectName)}&select=id&limit=1`
      );
      if (existing && existing[0]) {
        fields.subject_id = existing[0].id;
      } else {
        const created = await sb(context.env, 'cl_material_subjects', {
          method: 'POST',
          body: { teacher_id: auth.user.id, name: subjectName },
        });
        if (created && created[0]) fields.subject_id = created[0].id;
      }
    }
    const rows = await sb(context.env, 'cl_materials', {
      method: 'POST',
      body: { ...fields, teacher_id: auth.user.id },
    });
    return envelope(rows && rows[0] ? rows[0] : null, null, 201);
  } catch (e) {
    return errResponse(e.message || 'Failed to create the material.', 502);
  }
}
