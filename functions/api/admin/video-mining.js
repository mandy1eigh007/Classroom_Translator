import { corsPreflight, envelope, errResponse, isUuid, readBody, requireAdmin } from '../teacher/_auth.js';
import { addManualTranscript, addVideoUrl, discoverVideos, getSourceTranscript, miningSnapshot, reviewCandidate, runMining, saveMiningSettings } from '../_video_mining.js';

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestGet(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  try { return envelope(await miningSnapshot(context.env)); }
  catch (error) { return errResponse(error.message || 'Could not load video mining.', error.status || 500); }
}

export async function onRequestPost(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  const body = await readBody(context.request);
  if (!body || !body.action) return errResponse('An action is required.');
  try {
    let data;
    if (body.action === 'search') data = await discoverVideos(context.env, body.query, auth.user.id);
    else if (body.action === 'add_url') data = await addVideoUrl(context.env, body.url, auth.user.id);
    else if (body.action === 'add_transcript') data = await addManualTranscript(context.env, body, auth.user.id);
    else if (body.action === 'run') data = await runMining(context.env, { runType: 'manual', triggeredBy: auth.user.id, limit: body.limit });
    else if (body.action === 'save_settings') data = await saveMiningSettings(context.env, body.settings || {});
    else if (body.action === 'review') {
      if (!isUuid(body.id)) return errResponse('A valid candidate id is required.');
      data = await reviewCandidate(context.env, body.id, body.decision);
    }
    else if (body.action === 'transcript') {
      if (!isUuid(body.id)) return errResponse('A valid source id is required.');
      data = await getSourceTranscript(context.env, body.id);
    }
    else return errResponse('Unknown video mining action.');
    return envelope(data);
  } catch (error) {
    const message = String(error.message || error);
    const status = /not configured/i.test(message) ? 503 : (error.status || 400);
    return errResponse(message, status);
  }
}
