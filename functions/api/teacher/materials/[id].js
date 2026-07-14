// /api/teacher/materials/:id — GET, PUT a single material.
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, pick, isUuid } from '../_auth.js';
import { validateMaterialRefs } from '../_material_refs.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid material id.');
  try {
    const rows = await sb(
      context.env,
      `cl_materials?id=eq.${id}&teacher_id=eq.${auth.user.id}` +
      `&select=*,cl_material_subjects(id,name),cl_material_translations(id,target_language,translated_content,translation_status,updated_at)`
    );
    if (!rows || !rows[0]) return errResponse('Material not found.', 404);
    return envelope(rows[0]);
  } catch (e) {
    return errResponse(e.message || 'Failed to load the material.', 502);
  }
}

export async function onRequestPut(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid material id.');
  const body = await readBody(context.request);
  const fields = pick(body, [
    'class_id', 'subject_id', 'category', 'lesson', 'title',
    'material_type', 'source_language', 'content', 'is_published',
  ]);
  if (!Object.keys(fields).length) return errResponse('Nothing to update.');
  if (fields.class_id && !isUuid(fields.class_id)) return errResponse('Invalid class id.');
  if (fields.subject_id && !isUuid(fields.subject_id)) return errResponse('Invalid subject id.');
  try {
    const refError = await validateMaterialRefs(context.env, auth.user.id, fields);
    if (refError) return refError;

    const rows = await sb(context.env, `cl_materials?id=eq.${id}&teacher_id=eq.${auth.user.id}`, {
      method: 'PATCH',
      body: fields,
    });
    if (!rows || !rows[0]) return errResponse('Material not found.', 404);
    return envelope(rows[0]);
  } catch (e) {
    return errResponse(e.message || 'Failed to update the material.', 502);
  }
}
