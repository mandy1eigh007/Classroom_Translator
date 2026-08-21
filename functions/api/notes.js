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
  cooldownOk, clientIp, NOTES_PER_CLASS_CAP, checkTeacher, putSession,
} from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => ({}));
  const lang = String(body.lang || '');
  const room = String(body.c || '');
  if (lang !== 'English' && !LANG_CODES[lang]) return json({ error: 'Unsupported language' }, 400);
  if (!env.OPENAI_API_KEY) return json({ error: 'Notes are not available right now.' }, 503);

  if (body.action === 'publish') {
    const auth = await checkTeacher(context, body);
    if (!auth.ok) return auth.response;
    const notes = String(body.notes || '').trim().slice(0, 12000);
    if (!notes) return json({ error: 'Missing notes.' }, 400);
    const s = await getOrCreateSession(env);
    if (room !== s.code) return json({ error: 'No active class.' }, 403);
    const published = {
      ts: Date.now(),
      lang: 'English',
      title: 'Teacher posted study notes',
      notes,
      coverage: body.coverage || null,
    };
    await env.SESSION_KV.put('notes:published:' + s.code, JSON.stringify(published), {
      expirationTtl: 60 * 60 * 12,
    });
    s.notesV = (s.notesV || 0) + 1;
    await putSession(env, s);
    return json({ ok: true, notesV: s.notesV });
  }

  // The topics scan uses its own cooldown key so picking a topic right after
  // doesn't trip the notes cooldown.
  const cdKey = body.action === 'topics' ? 'notestopics' : 'notes';
  if (!(await cooldownOk(env, cdKey, clientIp(request), 20))) {
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

  // Topic scan: return a list of topics covered, no notes generated yet.
  // Doesn't count against the per-class notes cap.
  if (body.action === 'topics') {
    if (!transcript || transcript.length < 40) return json({ topics: [] });
    const clipped = transcript.length > 60000 ? transcript.slice(-60000) : transcript;
    try {
      const raw = await openaiChat(env, {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Given this classroom transcript, identify 3-6 distinct topics or subjects covered. Return ONLY a valid JSON object: {"topics": ["Topic One", "Topic Two"]}. Short topic names, 2-5 words each, most important first. No other text.',
          },
          { role: 'user', content: clipped },
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }, 15000);
      let topics = [];
      try { topics = JSON.parse(raw).topics || []; } catch (_) {}
      return json({ topics });
    } catch (_) {
      return json({ topics: [] });
    }
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

  const topic = String(body.topic || '');
  const focused = topic && topic !== 'All topics';
  const clipped = transcript.length > 60000 ? transcript.slice(-60000) : transcript;
  try {
    const notes = await openaiChat(env, {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: focused
            ? `You write study notes for a student in a pre-apprentice construction class. ` +
              `Given a raw classroom transcript, produce focused study notes IN ${lang} covering ONLY the topic: '${topic}'. Ignore unrelated content. ` +
              `Structure: title, then 3-5 sections with short headings and bullet points. ` +
              `Include key vocabulary (English term in parentheses), safety reminders, any steps or procedures. ` +
              `Be concise — 150-300 words. Output ONLY in ${lang} except English terms in parentheses.`
            : `You write study notes for a student in a pre-apprentice construction class. ` +
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
