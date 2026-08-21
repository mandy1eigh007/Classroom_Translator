// /api/studysheet — printable end-of-class vocabulary sheet in the
// student's language. Replaces Express /studysheet. Opens in a new tab;
// the student prints to PDF or keeps the tab.
//
// GET /api/studysheet?lang={langName}&c={roomCode} -> text/html
//
// Env vars: OPENAI_API_KEY.
import {
  json, getOrCreateSession, LANG_CODES, openaiChat, readTranscript,
  cooldownOk, clientIp, escHtml,
} from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const url = new URL(request.url);
  const lang = String(url.searchParams.get('lang') || '');
  const room = String(url.searchParams.get('c') || '');
  const plain = (msg, status = 400) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain' } });

  if (lang !== 'English' && !LANG_CODES[lang]) return plain('Unsupported language.');
  if (!env.OPENAI_API_KEY) return plain('Study sheet is not available right now.', 503);
  if (!(await cooldownOk(env, 'study', clientIp(request), 5))) {
    return plain('Please wait a few seconds before regenerating.', 429);
  }

  const s = await getOrCreateSession(env);
  let transcript = '';
  if (room === s.code) {
    transcript = (await readTranscript(env, s.epoch)).transcript;
  } else {
    const snap = await env.SESSION_KV.get('snapshot:' + room, 'json');
    if (!snap) return plain('Class ended.', 410);
    transcript = snap.transcript || '';
  }

  const html = (body) => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  if (!transcript || transcript.length < 40) {
    return html(renderStudySheet(lang, [], 'Not enough class content yet — try again later.'));
  }

  const clipped = transcript.length > 50000 ? transcript.slice(-50000) : transcript;
  const sameLanguage = lang === 'English';
  try {
    const raw = await openaiChat(env, {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `You build a vocabulary study sheet for an adult ESL learner in a pre-apprentice construction class. ` +
            `Given a raw English transcript of what the instructor said, pick 10-20 of the MOST USEFUL English terms or short phrases the student should learn (priority: tools, materials, jobsite verbs, safety terms, key processes). ` +
            `Skip generic vocabulary they already know (the, and, today). Skip filler. ` +
            (sameLanguage
              ? `The learner selected English. Every field must be written in English only. For tr, repeat the English term or use a plain-English equivalent. For defTr and exTr, use plain English; do not translate into any other language. `
              : `Translate learner-language fields into ${lang}. `) +
            `Return ONLY a JSON object: {"items": [{"en": "...", "tr": "translation into ${lang}", "defEn": "short plain English definition (10-15 words)", "defTr": "that definition in ${lang}", "exEn": "one short example sentence in English using the word, jobsite-relevant", "exTr": "that example in ${lang}"}]}` +
            ` No markdown. No commentary.`,
        },
        { role: 'user', content: clipped },
      ],
      max_tokens: 4000,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }, 60000);
    let parsed; try { parsed = JSON.parse(raw); } catch (_) { parsed = { items: [] }; }
    let items = Array.isArray(parsed.items) ? parsed.items.slice(0, 25) : [];
    if (sameLanguage) {
      items = items.map((it) => ({
        ...it,
        tr: it.en || it.tr || '',
        defTr: it.defEn || it.defTr || '',
        exTr: it.exEn || it.exTr || '',
      }));
    }
    return html(renderStudySheet(lang, items));
  } catch (_) {
    return plain('Could not generate study sheet.', 502);
  }
}

function renderStudySheet(lang, items, emptyMsg) {
  const today = new Date().toLocaleDateString();
  const rows = items.map((it, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="en"><strong>${escHtml(it.en)}</strong><div class="def">${escHtml(it.defEn)}</div><div class="ex">"${escHtml(it.exEn)}"</div></td>
      <td class="tr"><strong>${escHtml(it.tr)}</strong><div class="def">${escHtml(it.defTr)}</div><div class="ex">"${escHtml(it.exTr)}"</div></td>
    </tr>
  `).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Study sheet — ${escHtml(lang)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 780px; margin: 24px auto; padding: 0 16px; color: #2a1a0f; background: #fdf6e3; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .sub { color: #6b4f3a; font-size: 13px; margin: 0 0 16px; }
  .print-hint { background: #fffaeb; border: 2px solid #e0a82e; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; background: #fff; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  th { background: #f4f4f4; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #555; }
  td.num { width: 28px; color: #999; font-size: 12px; }
  td.en, td.tr { font-size: 15px; }
  td.en strong { font-size: 16px; }
  td.tr strong { font-size: 16px; color: #c2362e; }
  .def { color: #555; font-size: 13px; margin: 4px 0 2px; }
  .ex { color: #888; font-style: italic; font-size: 13px; }
  button.print { background: #c2362e; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 14px; cursor: pointer; margin-bottom: 12px; }
  @media print { .print-hint, button.print { display: none; } body { margin: 0; background: #fff; } }
  .empty { padding: 24px; text-align: center; color: #888; font-style: italic; }
</style></head><body>
<h1>Class study sheet</h1>
<p class="sub">${escHtml(lang)} · ${escHtml(today)}</p>
<button class="print" onclick="window.print()">Print or save as PDF</button>
${emptyMsg ? `<div class="empty">${escHtml(emptyMsg)}</div>` : `
<p class="print-hint">Review these words before next class. The English word is on the left so you can match it when you hear it on the job.</p>
<table>
  <thead><tr><th>#</th><th>English</th><th>${escHtml(lang)}</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`}
</body></html>`;
}
