// /api/transcribe — Whisper fallback for the teacher's mic. Replaces
// Express /transcribe. Requires Bearer TEACHER_PASSWORD.
//
// POST multipart audio=<clip> -> { text }
//
// Env vars: OPENAI_API_KEY.
import { json, checkTeacher } from './_lib.js';

const MAX_AUDIO = 25 * 1024 * 1024; // OpenAI Whisper hard limit

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const auth = await checkTeacher(context, null);
  if (!auth.ok) return auth.response;
  if (!env.OPENAI_API_KEY) return json({ error: 'Transcription is not available right now.' }, 503);

  let formData;
  try { formData = await request.formData(); }
  catch (_) { return json({ error: 'Bad upload' }, 400); }
  const file = formData.get('audio');
  if (!file || typeof file === 'string' || !file.size) return json({ error: 'No audio uploaded' }, 400);
  if (file.size > MAX_AUDIO) return json({ error: 'Clip too large (25MB max).' }, 400);

  try {
    const fd = new FormData();
    fd.append('file', file, file.name || 'clip.webm');
    fd.append('model', 'whisper-1');
    fd.append('language', 'en');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
      body: fd,
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error('Whisper ' + r.status);
    const data = await r.json();
    return json({ text: String(data.text || '').trim() });
  } catch (_) {
    return json({ error: 'Could not transcribe that clip.' }, 502);
  }
}
