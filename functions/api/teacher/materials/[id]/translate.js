// POST /api/teacher/materials/:id/translate — pre-translate a material into
// a list of target languages and cache the results in cl_material_translations.
// Body: { languages: ["es", "so", ...] }  (ISO-ish codes from LANG_CODES)
import { requireTeacher, envelope, errResponse, corsPreflight, sb, readBody, isUuid } from '../../_auth.js';
import { LANG_CODES, translateAll } from '../../../_lib.js';

export function onRequestOptions() { return corsPreflight(); }

// Invert _lib's name->code map so the client can send codes.
const CODE_TO_NAME = Object.fromEntries(Object.entries(LANG_CODES).map(([name, code]) => [code, name]));

const MAX_LANGS_PER_REQUEST = 10;
const MAX_CONTENT_CHARS = 12000;

export async function onRequestPost(context) {
  const auth = await requireTeacher(context);
  if (auth.response) return auth.response;
  const id = context.params.id;
  if (!isUuid(id)) return errResponse('Invalid material id.');

  const body = await readBody(context.request);
  const langs = body && Array.isArray(body.languages) ? body.languages : null;
  if (!langs || !langs.length) return errResponse('Provide { languages: ["es", ...] }.');
  if (langs.length > MAX_LANGS_PER_REQUEST) {
    return errResponse(`Too many languages in one request (max ${MAX_LANGS_PER_REQUEST}).`);
  }

  let material;
  try {
    const rows = await sb(
      context.env,
      `cl_materials?id=eq.${id}&teacher_id=eq.${auth.user.id}&select=id,title,content,material_type,source_language`
    );
    material = rows && rows[0];
  } catch (e) {
    return errResponse(e.message || 'Failed to load the material.', 502);
  }
  if (!material) return errResponse('Material not found.', 404);
  const content = String(material.content || '').trim();
  if (!content) return errResponse('This material has no text content to translate.');
  if (content.length > MAX_CONTENT_CHARS) {
    return errResponse(`Material is too long to pre-translate (max ${MAX_CONTENT_CHARS} characters).`);
  }

  const results = {};
  for (const raw of langs) {
    const code = String(raw || '').trim();
    const langName = CODE_TO_NAME[code];
    if (!langName) { results[code || '?'] = { status: 'error', message: 'Unsupported language code.' }; continue; }
    if (code === 'en') { results[code] = { status: 'complete', message: 'Source language — no translation needed.' }; continue; }

    let status = 'complete';
    let translated = '';
    let message = null;
    try {
      translated = await translateAll(context.env, content, langName, 30000);
      if (!translated) throw new Error('Empty translation.');
    } catch (e) {
      status = 'error';
      translated = '';
      message = e.message || 'Translation failed.';
    }
    try {
      await sb(context.env, 'cl_material_translations?on_conflict=material_id,target_language', {
        method: 'POST',
        body: {
          material_id: id,
          target_language: code,
          translated_content: translated,
          translation_status: status,
          updated_at: new Date().toISOString(),
        },
        prefer: 'return=minimal,resolution=merge-duplicates',
      });
    } catch (e) {
      status = 'error';
      message = message || e.message || 'Could not save the translation.';
    }
    results[code] = message ? { status, message } : { status };
  }
  return envelope({ material_id: id, results });
}
