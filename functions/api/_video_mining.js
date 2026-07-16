import { openaiChat, sha1 } from './_lib.js';
import { sb } from './teacher/_auth.js';
import { cuesToTranscript, fetchCaptions, fetchYouTubeMetadata, parseYouTubeId, searchYouTube } from './_youtube.js';

export const DEFAULT_MINING_SETTINGS = {
  automation_enabled: false,
  trades: ['Construction', 'Carpentry', 'Electrical', 'Plumbing', 'HVAC', 'Safety', 'Flagging', 'Forklift'],
  trusted_channels: [], blocked_channels: [],
  search_terms: ['construction training', 'carpentry training', 'electrical apprenticeship', 'plumbing apprenticeship', 'jobsite safety'],
  max_videos_per_run: 3, minimum_independent_sources: 3,
  minimum_confidence: 0.9, captions_required: true,
};

const SOURCE_SELECT = 'id,youtube_video_id,url,title,channel_id,channel_name,published_at,duration_seconds,thumbnail_url,discovery_query,discovery_mode,selected,transcript_source,transcript_status,processing_status,error_code,error_message,attempt_count,created_at,updated_at';
const CANDIDATE_SELECT = 'id,phrase,variants,trade,category,plain_english_meaning,translation_warning,example_usage,region,confidence,independent_source_count,status,attention_reason,published_phrase_id,first_seen_at,last_seen_at,updated_at';

export function normalizePhrase(value) {
  return String(value || '').toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function shouldAutoPublish(candidate, settings = DEFAULT_MINING_SETTINGS) {
  return Number(candidate.independent_source_count) >= Number(settings.minimum_independent_sources || 3)
    && Number(candidate.confidence) >= Number(settings.minimum_confidence || 0.9);
}

export async function getMiningSettings(env) {
  const rows = await sb(env, 'cl_app_settings?key=eq.video_mining&select=value');
  return { ...DEFAULT_MINING_SETTINGS, ...((rows[0] && rows[0].value) || {}) };
}

export async function saveMiningSettings(env, input) {
  const current = await getMiningSettings(env);
  const next = {
    ...current,
    automation_enabled: !!input.automation_enabled,
    trades: cleanList(input.trades, 30),
    trusted_channels: cleanList(input.trusted_channels, 100),
    blocked_channels: cleanList(input.blocked_channels, 100),
    search_terms: cleanList(input.search_terms, 30),
    max_videos_per_run: clamp(input.max_videos_per_run, 1, 10, 3),
    minimum_independent_sources: 3,
    minimum_confidence: 0.9,
    captions_required: true,
  };
  await sb(env, 'cl_app_settings?on_conflict=key', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: { key: 'video_mining', value: next, updated_at: new Date().toISOString() } });
  return next;
}

export async function miningSnapshot(env) {
  const [settings, sources, candidates, phrases, runs] = await Promise.all([
    getMiningSettings(env),
    sb(env, `cl_video_sources?select=${SOURCE_SELECT}&order=created_at.desc&limit=80`),
    sb(env, `cl_video_vocab_candidates?select=${CANDIDATE_SELECT}&order=updated_at.desc&limit=100`),
    sb(env, 'cl_trade_phrases?select=id,phrase,variants,trade,plain_english_meaning,translation_warning,example_usage,confidence,independent_source_count,active,auto_published,updated_at&order=updated_at.desc&limit=100'),
    sb(env, 'cl_video_mining_runs?select=*&order=started_at.desc&limit=15'),
  ]);
  return { settings, configured: { youtube: !!env.YOUTUBE_API_KEY, ai: !!env.OPENAI_API_KEY }, sources, candidates, phrases, runs };
}

export async function getSourceTranscript(env, id) {
  const rows = await sb(env, `cl_video_sources?id=eq.${id}&select=id,title,channel_name,transcript_text,transcript_status,error_message`);
  if (!rows[0]) throw new Error('Transcript source was not found.');
  return rows[0];
}

export async function discoverVideos(env, query, selectedBy) {
  const cleanQuery = String(query || '').trim().slice(0, 180);
  if (!cleanQuery) throw new Error('Enter a trade or search phrase.');
  const settings = await getMiningSettings(env);
  const found = await searchYouTube(env, cleanQuery, settings.max_videos_per_run);
  const blocked = new Set(settings.blocked_channels.map(normalizePhrase));
  const accepted = found.filter(item => !blocked.has(normalizePhrase(item.channel_id)) && !blocked.has(normalizePhrase(item.channel_name)));
  for (const item of accepted) {
    await upsertSource(env, { ...item, discovery_query: cleanQuery, discovery_mode: 'youtube_search', selected_by: selectedBy });
  }
  return accepted;
}

export async function addVideoUrl(env, value, selectedBy) {
  const videoId = parseYouTubeId(value);
  if (!videoId) throw new Error('Enter a valid YouTube video link.');
  const metadata = await fetchYouTubeMetadata(env, videoId);
  return upsertSource(env, { ...metadata, discovery_mode: 'manual_url', selected_by: selectedBy });
}

export async function addManualTranscript(env, input, selectedBy) {
  const transcript = String(input.transcript || '').trim();
  if (transcript.length < 120) throw new Error('Paste at least 120 characters of transcript.');
  if (transcript.length > 200000) throw new Error('Transcript is too large. Split it into smaller sources.');
  const hash = await sha1(transcript);
  const existing = await sb(env, `cl_video_sources?transcript_hash=eq.${hash}&select=*`);
  if (existing[0]) return existing[0];
  const channelName = String(input.channel_name || 'Manual source').trim().slice(0, 200);
  const channelKey = await sha1(normalizePhrase(channelName));
  const rows = await sb(env, 'cl_video_sources', { method: 'POST', body: {
    title: String(input.title || 'Pasted trade transcript').trim().slice(0, 300),
    channel_name: channelName,
    channel_id: `manual:${channelKey}`,
    discovery_mode: 'manual_transcript', transcript_source: 'manual', transcript_text: transcript,
    transcript_hash: hash, transcript_language: 'en', transcript_status: 'ready', processing_status: 'queued', selected_by: selectedBy,
  } });
  return rows[0];
}

async function upsertSource(env, source) {
  const body = {
    youtube_video_id: source.youtube_video_id, url: source.url, title: source.title,
    channel_id: source.channel_id, channel_name: source.channel_name,
    published_at: source.published_at, duration_seconds: source.duration_seconds,
    thumbnail_url: source.thumbnail_url, discovery_query: source.discovery_query,
    discovery_mode: source.discovery_mode, selected_by: source.selected_by || null,
    transcript_status: 'queued', processing_status: 'queued', selected: true,
    updated_at: new Date().toISOString(),
  };
  const rows = await sb(env, 'cl_video_sources?on_conflict=youtube_video_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body });
  return rows[0];
}

export async function runMining(env, { runType = 'manual', triggeredBy = null, limit } = {}) {
  if (!env.OPENAI_API_KEY) throw new Error('AI extraction is not configured.');
  const settings = await getMiningSettings(env);
  const max = clamp(limit, 1, 10, settings.max_videos_per_run);
  const runRows = await sb(env, 'cl_video_mining_runs', { method: 'POST', body: { run_type: runType, model: 'gpt-4o-mini', triggered_by: triggeredBy } });
  const run = runRows[0];
  let processed = 0, transcriptsReady = 0, candidatesFound = 0, published = 0, needsAttention = 0, errors = 0;
  try {
    const sources = await sb(env, `cl_video_sources?selected=eq.true&processing_status=in.(queued,error)&select=*&order=created_at.asc&limit=${max}`);
    for (const source of sources) {
      try {
        const result = await processSource(env, source, settings);
        processed++; transcriptsReady++; candidatesFound += result.candidates;
        published += result.published; needsAttention += result.needsAttention;
      } catch (error) {
        errors++;
        await sb(env, `cl_video_sources?id=eq.${source.id}`, { method: 'PATCH', body: { processing_status: 'error', error_code: 'processing_failed', error_message: String(error.message || error).slice(0, 500), last_attempt_at: new Date().toISOString(), attempt_count: Number(source.attempt_count || 0) + 1, updated_at: new Date().toISOString() } });
      }
    }
    const status = errors && processed ? 'partial' : errors ? 'error' : 'complete';
    await sb(env, `cl_video_mining_runs?id=eq.${run.id}`, { method: 'PATCH', body: { status, videos_found: sources.length, videos_processed: processed, transcripts_ready: transcriptsReady, candidates_found: candidatesFound, auto_published: published, needs_attention: needsAttention, error_count: errors, completed_at: new Date().toISOString() } });
    return { run_id: run.id, status, videos_found: sources.length, videos_processed: processed, candidates_found: candidatesFound, auto_published: published, needs_attention: needsAttention, errors };
  } catch (error) {
    await sb(env, `cl_video_mining_runs?id=eq.${run.id}`, { method: 'PATCH', body: { status: 'error', error_count: errors + 1, error_message: String(error.message || error).slice(0, 500), completed_at: new Date().toISOString() } });
    throw error;
  }
}

export async function runScheduledMining(env) {
  const settings = await getMiningSettings(env);
  if (!settings.automation_enabled) return { status: 'disabled' };
  const terms = settings.search_terms || [];
  if (env.YOUTUBE_API_KEY && terms.length) {
    const day = Math.floor(Date.now() / 86400000);
    await discoverVideos(env, terms[day % terms.length], null);
  }
  return runMining(env, { runType: 'scheduled', limit: settings.max_videos_per_run });
}

async function processSource(env, source, settings) {
  await sb(env, `cl_video_sources?id=eq.${source.id}`, { method: 'PATCH', body: { processing_status: 'extracting', last_attempt_at: new Date().toISOString(), error_code: null, error_message: null } });
  let transcript = source.transcript_text;
  if (!transcript) {
    if (!source.youtube_video_id) throw new Error('Source has no transcript or YouTube video.');
    await sb(env, `cl_video_sources?id=eq.${source.id}`, { method: 'PATCH', body: { transcript_status: 'pulling' } });
    try { transcript = cuesToTranscript(await fetchCaptions(source.youtube_video_id)); }
    catch (error) {
      await sb(env, `cl_video_sources?id=eq.${source.id}`, { method: 'PATCH', body: { transcript_status: /no captions/i.test(error.message) ? 'no_captions' : 'error' } });
      throw error;
    }
    await sb(env, `cl_video_sources?id=eq.${source.id}`, { method: 'PATCH', body: { transcript_text: transcript, transcript_hash: await sha1(transcript), transcript_source: 'captions', transcript_language: 'en', transcript_status: 'ready' } });
  }
  const extracted = await extractTradeLanguage(env, transcript, source.title, settings.trades);
  let published = 0, needsAttention = 0;
  for (const item of extracted) {
    const result = await mergeCandidate(env, source, item, settings);
    if (result === 'auto_published') published++;
    if (result === 'needs_attention') needsAttention++;
  }
  await sb(env, `cl_video_sources?id=eq.${source.id}`, { method: 'PATCH', body: { transcript_status: 'ready', processing_status: 'complete', attempt_count: Number(source.attempt_count || 0) + 1, updated_at: new Date().toISOString() } });
  if (published) await compileTradeLexicon(env);
  return { candidates: extracted.length, published, needsAttention };
}

async function extractTradeLanguage(env, transcript, title, trades) {
  const content = await openaiChat(env, {
    model: 'gpt-4o-mini', temperature: 0, max_tokens: 5000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `You extract American construction jobsite language. Find only idioms, shop talk, commands, shorthand, and trade terms that a literal translator could mistranslate. Skip ordinary English and product promotion. Return JSON {"phrases":[{"phrase":"","variants":[],"trade":"one of ${trades.join(', ')} or General","category":"Shop talk|Command|Tool|Process|Safety","plain_english_meaning":"","translation_warning":"what not to translate literally","example_usage":"","region":"US trades","confidence":0.0,"context_quote":"exact short quote from transcript"}]}. Confidence measures whether the phrase and intended field meaning are clear. Return at most 24 phrases.` },
      { role: 'user', content: `VIDEO: ${String(title || '').slice(0, 300)}\nTRANSCRIPT:\n${String(transcript).slice(0, 70000)}` },
    ],
  }, 45000);
  let parsed;
  try { parsed = JSON.parse(content); } catch (_) { throw new Error('AI returned invalid extraction data.'); }
  const normalizedTranscript = normalizePhrase(transcript);
  return (Array.isArray(parsed.phrases) ? parsed.phrases : []).map(cleanCandidate).filter(item => {
    const quote = normalizePhrase(item.context_quote);
    return item.phrase && item.plain_english_meaning && quote.length >= 8
      && normalizedTranscript.includes(quote) && item.confidence >= 0.55;
  });
}

async function mergeCandidate(env, source, item, settings) {
  const normalized = normalizePhrase(item.phrase);
  const trade = item.trade || 'General';
  const region = item.region || 'US trades';
  const query = `normalized_phrase=eq.${encodeURIComponent(normalized)}&trade=eq.${encodeURIComponent(trade)}&region=eq.${encodeURIComponent(region)}&select=*`;
  let candidate = (await sb(env, `cl_video_vocab_candidates?${query}`))[0];
  if (!candidate) {
    const related = await sb(env, `cl_video_vocab_candidates?trade=eq.${encodeURIComponent(trade)}&region=eq.${encodeURIComponent(region)}&select=*&limit=500`);
    const incoming = new Set([normalized, ...(item.variants || []).map(normalizePhrase)]);
    candidate = related.find(row => incoming.has(row.normalized_phrase)
      || (row.variants || []).some(variant => incoming.has(normalizePhrase(variant))));
  }
  const now = new Date().toISOString();
  if (!candidate) {
    candidate = (await sb(env, 'cl_video_vocab_candidates', { method: 'POST', body: { ...item, normalized_phrase: normalized, trade, region, status: 'candidate', first_seen_at: now, last_seen_at: now } }))[0];
  } else {
    const variants = [...new Set([...(candidate.variants || []), ...(item.variants || [])])].slice(0, 30);
    candidate = (await sb(env, `cl_video_vocab_candidates?id=eq.${candidate.id}`, { method: 'PATCH', body: { variants, last_seen_at: now, updated_at: now } }))[0];
  }
  await sb(env, 'cl_trade_phrase_evidence?on_conflict=candidate_id,source_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: { candidate_id: candidate.id, source_id: source.id, context_quote: item.context_quote.slice(0, 1000), model_confidence: item.confidence } });
  const evidence = await sb(env, `cl_trade_phrase_evidence?candidate_id=eq.${candidate.id}&select=model_confidence,cl_video_sources(channel_id,channel_name)`);
  const sourceKeys = new Set(evidence.map(row => row.cl_video_sources && (row.cl_video_sources.channel_id || row.cl_video_sources.channel_name)).filter(Boolean));
  const confidence = evidence.reduce((sum, row) => sum + Number(row.model_confidence || 0), 0) / Math.max(1, evidence.length);
  const aggregate = { independent_source_count: sourceKeys.size, confidence: Number(confidence.toFixed(4)) };
  const conflict = candidate.plain_english_meaning && meaningConflict(candidate.plain_english_meaning, item.plain_english_meaning);
  let status = 'candidate', attentionReason = null, publishedPhraseId = candidate.published_phrase_id;
  if (conflict) { status = 'needs_attention'; attentionReason = 'Independent sources suggest conflicting meanings.'; }
  else if (shouldAutoPublish(aggregate, settings)) {
    const phraseRows = await sb(env, 'cl_trade_phrases?on_conflict=normalized_phrase,trade,region', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: { phrase: candidate.phrase, normalized_phrase: normalized, variants: candidate.variants || item.variants, trade, category: candidate.category, plain_english_meaning: candidate.plain_english_meaning, translation_warning: candidate.translation_warning, example_usage: candidate.example_usage, region, ...aggregate, active: true, auto_published: true, last_seen_at: now, updated_at: now } });
    status = 'auto_published'; publishedPhraseId = phraseRows[0].id;
  } else if (aggregate.independent_source_count >= 3 && aggregate.confidence < 0.75) {
    status = 'needs_attention'; attentionReason = 'Multiple sources found, but the intended meaning remains unclear.';
  }
  await sb(env, `cl_video_vocab_candidates?id=eq.${candidate.id}`, { method: 'PATCH', body: { ...aggregate, status, attention_reason: attentionReason, published_phrase_id: publishedPhraseId, last_seen_at: now, updated_at: now } });
  return status;
}

export async function reviewCandidate(env, id, decision) {
  const candidate = (await sb(env, `cl_video_vocab_candidates?id=eq.${id}&select=*`))[0];
  if (!candidate) throw new Error('Candidate was not found.');
  if (decision === 'reject') {
    await sb(env, `cl_video_vocab_candidates?id=eq.${id}`, { method: 'PATCH', body: { status: 'rejected', attention_reason: 'Rejected by administrator.', updated_at: new Date().toISOString() } });
    return { status: 'rejected' };
  }
  if (decision !== 'approve') throw new Error('Choose approve or reject.');
  const phrase = (await sb(env, 'cl_trade_phrases?on_conflict=normalized_phrase,trade,region', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: { phrase: candidate.phrase, normalized_phrase: candidate.normalized_phrase, variants: candidate.variants, trade: candidate.trade, category: candidate.category, plain_english_meaning: candidate.plain_english_meaning, translation_warning: candidate.translation_warning, example_usage: candidate.example_usage, region: candidate.region, confidence: candidate.confidence, independent_source_count: candidate.independent_source_count, active: true, auto_published: false, updated_at: new Date().toISOString() } }))[0];
  await sb(env, `cl_video_vocab_candidates?id=eq.${id}`, { method: 'PATCH', body: { status: 'auto_published', attention_reason: null, published_phrase_id: phrase.id, updated_at: new Date().toISOString() } });
  await compileTradeLexicon(env);
  return { status: 'published', phrase_id: phrase.id };
}

export async function compileTradeLexicon(env) {
  const phrases = await sb(env, 'cl_trade_phrases?active=eq.true&select=phrase,variants,trade,plain_english_meaning,translation_warning&order=updated_at.desc&limit=1000');
  const lexicon = { version: Date.now(), phrases };
  if (env.SESSION_KV) await env.SESSION_KV.put('trade-lexicon:v1', JSON.stringify(lexicon));
  return lexicon;
}

function cleanCandidate(item) {
  return {
    phrase: String(item.phrase || '').trim().slice(0, 200), variants: cleanList(item.variants, 30),
    trade: String(item.trade || 'General').trim().slice(0, 80), category: String(item.category || 'Shop talk').trim().slice(0, 80),
    plain_english_meaning: String(item.plain_english_meaning || '').trim().slice(0, 1000),
    translation_warning: String(item.translation_warning || '').trim().slice(0, 1000) || null,
    example_usage: String(item.example_usage || '').trim().slice(0, 1000) || null,
    region: String(item.region || 'US trades').trim().slice(0, 80),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
    context_quote: String(item.context_quote || '').trim().slice(0, 1000),
  };
}

function cleanList(value, max) {
  const list = Array.isArray(value) ? value : String(value || '').split(/[\n,]/);
  return [...new Set(list.map(item => String(item).trim()).filter(Boolean))].slice(0, max);
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}

function meaningConflict(a, b) {
  const left = new Set(normalizePhrase(a).split(' ').filter(word => word.length > 3));
  const right = new Set(normalizePhrase(b).split(' ').filter(word => word.length > 3));
  if (!left.size || !right.size) return false;
  const overlap = [...left].filter(word => right.has(word)).length;
  return overlap / Math.min(left.size, right.size) < 0.15;
}
