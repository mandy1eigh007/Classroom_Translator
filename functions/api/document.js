// /api/document — shared document (handout / worksheet / photo).
// Replaces Express /document/upload, /document/page, /document/clear and
// the SSE 'doc' / 'doc-text' events.
//
// GET                    -> { docId, name, type, pageCount, currentPage,
//                             hasImage, pageEn }   (current page's English)
// POST multipart (teacher) file=<upload>           -> upload / replace
// POST JSON (teacher)    -> { action: "page", page } | { action: "clear" }
//
// SUPPORTED UPLOADS on Workers:
//   .txt        read as text (single page)
//   images      (png/jpg/webp/gif) stored + OCR'd via OpenAI vision
//   .pdf        prepared client-side by the teacher page, then stored here
// STUBBED (Node parsing libs don't run in Workers):
//   .docx/.pptx -> 415 { error: "DOCX/PPTX parsing coming soon —
//                        please share as PDF, plain text, or image for now" }
//
// Students see the page image (if any) + English text; translation happens
// client-side through /api/translate (KV-cached once per language).
// Env vars: OPENAI_API_KEY (image OCR only).
import { json, getOrCreateSession, putSession, checkTeacher } from './_lib.js';

const MAX_UPLOAD = 8 * 1024 * 1024; // KV value cap is 25MB; keep well under
const DOC_TTL = 60 * 60 * 12;

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    const meta = await env.SESSION_KV.get('doc:meta', 'json');
    if (!meta) return json({ docId: null });
    const pageEn = (await env.SESSION_KV.get(`doc:page:${meta.docId}:${meta.currentPage}`)) || '';
    return json({ ...meta, pageEn });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ctype = request.headers.get('Content-Type') || '';

  // ---- multipart upload ----
  if (ctype.includes('multipart/form-data')) {
    const auth = await checkTeacher(context, null);
    if (!auth.ok) return auth.response;
    let formData;
    try { formData = await request.formData(); }
    catch (_) { return json({ error: 'Bad upload' }, 400); }
    const file = formData.get('file');
    if (!file || typeof file === 'string') return json({ error: 'No file uploaded' }, 400);
    if (file.size > MAX_UPLOAD) return json({ error: 'File too large (8MB max).' }, 400);

    const name = (file.name || 'document').slice(0, 120);
    const lower = name.toLowerCase();
    const mime = file.type || '';
    const isTxt = mime === 'text/plain' || lower.endsWith('.txt');
    const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/.test(lower);
    const isStubbed = /\.(pdf|docx|pptx|doc|ppt|xlsx)$/.test(lower) ||
      /(pdf|officedocument|msword|ms-powerpoint)/.test(mime);

    if (isStubbed) {
      return json({
        error: lower.endsWith('.pdf') || /pdf/.test(mime)
          ? 'PDF uploads are prepared in the browser. Refresh this page and try the PDF again.'
          : 'DOCX/PPTX parsing coming soon — please share as PDF, plain text, or image for now',
        stubbed: true,
      }, 415);
    }

    const docId = 'd' + Date.now().toString(36);
    let pageText = '';
    let hasImage = false;

    if (isTxt) {
      pageText = (await file.text()).trim().slice(0, 100000);
    } else if (isImage) {
      const bytes = await file.arrayBuffer();
      await env.SESSION_KV.put(`doc:img:${docId}:0`, bytes, {
        metadata: { mime: mime || 'image/png' },
        expirationTtl: DOC_TTL,
      });
      hasImage = true;
      // OCR via OpenAI vision so students get translated text too.
      if (env.OPENAI_API_KEY) {
        try { pageText = await ocrImage(env, bytes, mime || 'image/png'); }
        catch (_) { /* image-only page is still fine */ }
      }
    } else {
      return json({ error: 'Unsupported file type. Use TXT, PDF, or an image (JPG/PNG).' }, 415);
    }

    const meta = { docId, name, type: isTxt ? 'txt' : 'image', pageCount: 1, currentPage: 0, hasImage };
    await env.SESSION_KV.put(`doc:page:${docId}:0`, pageText, { expirationTtl: DOC_TTL });
    await env.SESSION_KV.put('doc:meta', JSON.stringify(meta));

    const s = await getOrCreateSession(env);
    s.docV += 1;
    await putSession(env, s);
    return json({ ok: true, ...meta, pageText });
  }

  // ---- JSON actions ----
  const body = await request.json().catch(() => ({}));
  const auth = await checkTeacher(context, body);
  if (!auth.ok) return auth.response;
  const action = String(body.action || '');
  const s = await getOrCreateSession(env);

  if (action === 'clear') {
    await env.SESSION_KV.delete('doc:meta');
    s.docV += 1;
    await putSession(env, s);
    return json({ ok: true });
  }

  if (action === 'uploadParsed') {
    const name = String(body.name || 'document.pdf').slice(0, 120);
    const pagesIn = Array.isArray(body.pages) ? body.pages.slice(0, 20) : [];
    if (!pagesIn.length) return json({ error: 'No readable PDF pages found.' }, 400);

    const docId = 'd' + Date.now().toString(36);
    let hasImage = false;
    const pages = [];

    for (let i = 0; i < pagesIn.length; i++) {
      const page = pagesIn[i] || {};
      const text = String(page.text || '').trim().slice(0, 100000);
      const imageDataUrl = String(page.imageDataUrl || '');
      let imageStored = false;

      if (imageDataUrl) {
        const parsed = parseImageDataUrl(imageDataUrl);
        if (!parsed) return json({ error: 'PDF page image could not be read.' }, 400);
        await env.SESSION_KV.put(`doc:img:${docId}:${i}`, parsed.bytes, {
          metadata: { mime: parsed.mime },
          expirationTtl: DOC_TTL,
        });
        hasImage = true;
        imageStored = true;
      }

      await env.SESSION_KV.put(`doc:page:${docId}:${i}`, text, { expirationTtl: DOC_TTL });
      pages.push({ text, imageStored });
    }

    const meta = {
      docId,
      name,
      type: body.sourceType === 'pdf' ? 'pdf' : 'prepared',
      pageCount: pages.length,
      currentPage: 0,
      hasImage,
    };
    await env.SESSION_KV.put('doc:meta', JSON.stringify(meta));
    s.docV += 1;
    await putSession(env, s);
    return json({ ok: true, ...meta, pageText: pages[0]?.text || '' });
  }

  if (action === 'page') {
    const meta = await env.SESSION_KV.get('doc:meta', 'json');
    if (!meta) return json({ error: 'No document loaded' }, 400);
    const page = Math.max(0, Math.min(meta.pageCount - 1, Number(body.page) || 0));
    meta.currentPage = page;
    await env.SESSION_KV.put('doc:meta', JSON.stringify(meta));
    s.docV += 1;
    await putSession(env, s);
    const pageText = (await env.SESSION_KV.get(`doc:page:${meta.docId}:${page}`)) || '';
    return json({ ok: true, currentPage: page, pageText });
  }

  return json({ error: 'Unknown action' }, 400);
}

async function ocrImage(env, bytes, mime) {
  const b64 = bufToBase64(bytes);
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an OCR engine. Extract ALL readable text from the image, ' +
            'preserving line breaks and paragraph structure. Reply with the ' +
            'extracted text only — no commentary, no markdown fences, no ' +
            'language tags. If the image has no readable text, reply with an ' +
            'empty string.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this image:' },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error('OCR failed ' + r.status);
  const data = await r.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function parseImageDataUrl(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match) return null;
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime: match[1].toLowerCase(), bytes: bytes.buffer };
}
