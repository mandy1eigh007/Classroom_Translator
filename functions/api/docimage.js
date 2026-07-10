// /api/docimage — serves the shared document's page image (photo uploads).
// Replaces Express /document/preview/:docId/:page. Public: students need it.
//
// GET /api/docimage?d={docId}&p={page} -> image bytes (404 if none)
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return new Response(null, { status: 405 });
  const url = new URL(request.url);
  const docId = (url.searchParams.get('d') || '').slice(0, 32);
  const page = Number(url.searchParams.get('p')) || 0;
  if (!docId || !/^[a-z0-9]+$/i.test(docId)) return new Response(null, { status: 404 });

  const { value, metadata } = await env.SESSION_KV.getWithMetadata(`doc:img:${docId}:${page}`, 'arrayBuffer');
  if (!value) return new Response(null, { status: 404 });
  return new Response(value, {
    headers: {
      'Content-Type': (metadata && metadata.mime) || 'image/png',
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  });
}
