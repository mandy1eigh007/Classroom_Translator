// ClassLingo /api/teacher/* — shared auth + Supabase REST helpers.
// Files prefixed "_" are not routed by Cloudflare Pages.
//
// Auth model: the dashboard (public/teacher.html) signs the teacher in with
// supabase-js (anon key) and sends the user's access token as
// "Authorization: Bearer <jwt>". Each route verifies the JWT against
// Supabase Auth (/auth/v1/user), confirms the profile role, then talks to
// PostgREST with the SERVICE ROLE key — always constrained by explicit
// teacher_id filters. The service role key never leaves the server.
//
// Required env vars (Cloudflare Pages -> Settings -> Environment variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   OPENAI_API_KEY (pre-translation route only)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// { data, error } envelope on every response.
export function envelope(data, error = null, status = 200) {
  return new Response(JSON.stringify({ data, error }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function errResponse(message, status = 400) {
  return envelope(null, message, status);
}

function serverConfig(env) {
  const url = (env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return { url, key };
}

// Verifies the caller's Supabase JWT and teacher/admin role.
// Returns { user, profile } or { response } (ready-to-return error).
export async function requireTeacher(context) {
  const { request, env } = context;
  const cfg = serverConfig(env);
  if (!cfg) {
    return { response: errResponse('Supabase is not configured on the server (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).', 503) };
  }
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return { response: errResponse('Missing Authorization bearer token.', 401) };
  }
  const token = auth.slice(7).trim();
  let user;
  try {
    const r = await fetch(cfg.url + '/auth/v1/user', {
      headers: { apikey: cfg.key, Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { response: errResponse('Invalid or expired session.', 401) };
    user = await r.json();
  } catch (_) {
    return { response: errResponse('Could not verify session with Supabase.', 502) };
  }
  if (!user || !user.id) return { response: errResponse('Invalid or expired session.', 401) };

  let profile = null;
  try {
    const rows = await sb(env, `cl_profiles?id=eq.${user.id}&select=id,role,display_name,email,organization_id,active`);
    profile = rows && rows[0] ? rows[0] : null;
  } catch (_) {
    return { response: errResponse('Could not load the teacher profile.', 502) };
  }
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return { response: errResponse('This account is not an instructor.', 403) };
  }
  if (profile.active === false) {
    return { response: errResponse('This instructor account is deactivated.', 403) };
  }
  return { user, profile };
}

// Minimal PostgREST client (service role; no SDK, no new dependencies).
// path example: "cl_classes?teacher_id=eq.<uuid>&order=created_at"
export async function sb(env, path, { method = 'GET', body, prefer } = {}) {
  const cfg = serverConfig(env);
  if (!cfg) throw new Error('Supabase not configured');
  const headers = {
    apikey: cfg.key,
    Authorization: 'Bearer ' + cfg.key,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  else if (method !== 'GET') headers.Prefer = 'return=representation';
  const r = await fetch(cfg.url + '/rest/v1/' + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const text = await r.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch (_) { data = null; }
  }
  if (!r.ok) {
    const msg = (data && (data.message || data.hint || data.details)) || `Supabase error ${r.status}`;
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function readBody(request) {
  try { return await request.json(); } catch (_) { return null; }
}

// Only allow whitelisted keys through to updates/inserts.
export function pick(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v) {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function genSessionCode() {
  // 6 chars, unambiguous alphabet.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  return [...buf].map(b => alphabet[b % alphabet.length]).join('');
}
