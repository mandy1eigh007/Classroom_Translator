async function scheduledRun(env) {
  if (!env.MINER_API_URL || !env.MINER_CRON_SECRET) throw new Error('Scheduled mining endpoint is not configured');
  const response = await fetch(env.MINER_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MINER_CRON_SECRET}` },
  });
  if (!response.ok) throw new Error(`Scheduled mining endpoint returned ${response.status}`);
  return response.json();
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(scheduledRun(env).catch(error => console.error('video mining schedule failed', error.message)));
  },
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/health') return new Response('Not found', { status: 404 });
    return Response.json({ service: 'classlingo-video-miner', status: 'ready' });
  },
};
