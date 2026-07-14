import { errResponse, sb } from './_auth.js';

function hasValue(v) {
  return v !== undefined && v !== null && v !== '';
}

export async function validateMaterialRefs(env, teacherId, fields) {
  if (hasValue(fields.class_id)) {
    const rows = await sb(env, `cl_classes?id=eq.${fields.class_id}&teacher_id=eq.${teacherId}&select=id&limit=1`);
    if (!rows || !rows[0]) return errResponse('Class not found.', 404);
  }

  if (hasValue(fields.subject_id)) {
    const rows = await sb(env, `cl_material_subjects?id=eq.${fields.subject_id}&teacher_id=eq.${teacherId}&select=id&limit=1`);
    if (!rows || !rows[0]) return errResponse('Subject not found.', 404);
  }

  return null;
}
