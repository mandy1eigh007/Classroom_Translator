// /api/teacher/vocab — GET list (optional ?category= &language=), POST create.
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, pick } from './_auth.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');
  const language = url.searchParams.get('language');
  try {
    let path = `cl_vocab_terms?teacher_id=eq.${auth.user.id}&order=term.asc&limit=500&select=*`;
    if (category) path += `&category=eq.${encodeURIComponent(category)}`;
    if (language) path += `&target_language=eq.${encodeURIComponent(language)}`;
    const rows = await sb(context.env, path);
    return envelope(rows || []);
  } catch (e) {
    return errResponse(e.message || 'Failed to list vocab terms.', 502);
  }
}

export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const body = await readBody(context.request);
  const fields = pick(body, ['term', 'category', 'source_language', 'translation', 'target_language', 'is_verified']);
  if (!fields.term || !String(fields.term).trim()) return errResponse('Term is required.');
  fields.term = String(fields.term).trim();
  try {
    const rows = await sb(context.env, 'cl_vocab_terms', {
      method: 'POST',
      body: { ...fields, teacher_id: auth.user.id },
    });
    return envelope(rows && rows[0] ? rows[0] : null, null, 201);
  } catch (e) {
    return errResponse(e.message || 'Failed to add the vocab term.', 502);
  }
}
