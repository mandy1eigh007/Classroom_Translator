// /api/notes — AI study notes from this class's English transcript, written
// in the student's language. Replaces Express /notes.
//
// POST { lang, c } -> { notes, lang, final, coverage: { count, durationMin } }
//
// Sources: the live transcript (room code matches), or the 10-minute
// post-class snapshot (old room code, saved by /api/session action:"new").
// Cost controls: 20s per-IP cooldown + a per-class generation cap shared
// between the live room and its snapshot.
// Env vars: OPENAI_API_KEY.
import {
  json, getOrCreateSession, LANG_CODES, openaiChat, readTranscript,
  cooldownOk, clientIp, NOTES_PER_CLASS_CAP,
} from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const lang = String(body.lang || '');
  const room = String(body.c || '');
  if (lang !== 'English' && !LANG_CODES[lang]) return json({ error: 'Unsupported language' }, 400);
  if (!env.OPENAI_API_KEY) return json({ error: 'Notes are not available right now.' }, 503);

  if (!(await cooldownOk(env, 'notes', clientIp(request), 20))) {
    return json({ error: 'Please wait a few seconds before generating again.' }, 429);
  }

  const s = await getOrCreateSession(env);
  let transcript = '', count = 0, durationMs = 0, final = false;
  if (room === s.code) {
    const t = await readTranscript(env, s.epoch);
    transcript = t.transcript; count = t.count; durationMs = t.durationMs;
  } else {
    const snap = await env.SESSION_KV.get('snapshot:' + room, 'json');
    if (!snap) return json({ error: 'Class ended' }, 410);
    transcript = snap.transcript || '';
    count = snap.count || 0;
    durationMs = snap.durationMs || 0;
    final = true;
  }

  if (!transcript || transcript.length < 40) return json({ notes: '', empty: true });

  // Per-class cap shared between live room and snapshot (keyed by the room
  // code on the request, same as the Express version).
  const capKey = 'notescount:' + room;
  const used = Number(await env.SESSION_KV.get(capKey)) || 0;
  if (used >= NOTES_PER_CLASS_CAP) {
    return json({ error: 'Notes limit reached for this class.' }, 429);
  }
  await env.SESSION_KV.put(capKey, String(used + 1), { expirationTtl: 60 * 60 * 12 });

  const clipped = transcript.length > 60000 ? transcript.slice(-60000) : transcript;
  try {
    const notes = await openaiChat(env, {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `You write study notes for a student in a pre-apprentice construction class. ` +
            `Given a raw classroom transcript (what the instructor said, in English), produce clear, organized study notes IN ${lang} that the student can review later. ` +
            `Structure: a brief title, then 3-7 sections with short headings and bullet points. ` +
            `Capture: key topics, important vocabulary (give the English term in parentheses next to the translation so it matches what they'll hear/read on the job), safety reminders, any steps/procedures, and any homework or follow-up the instructor mentioned. ` +
            `Skip filler and side conversation. Be concise — aim for 250-450 words. Output plain text with simple headings (no Markdown asterisks, just plain "Title:" style). Output ONLY in ${lang}, except for the English vocabulary terms in parentheses.`,
        },
        { role: 'user', content: clipped },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }, 45000);
    if (!notes) return json({ error: 'Could not generate notes.' }, 502);
    return json({
      notes, lang, final,
      coverage: { count, durationMin: Math.max(1, Math.round(durationMs / 60000)) },
    });
  } catch (_) {
    return json({ error: 'Could not generate notes.' }, 502);
  }
}
