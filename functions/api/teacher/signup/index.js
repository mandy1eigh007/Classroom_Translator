// POST /api/teacher/signup — invite-only teacher account creation.
import { envelope, errResponse, corsPreflight, sb, readBody } from '../_auth.js';

function cleanEmail(v) {
  return String(v || '').trim().toLowerCase();
}

function cleanName(v, email) {
  const name = String(v || '').trim();
  if (name) return name.slice(0, 120);
  return email.split('@')[0].replace(/[._-]+/g, ' ').slice(0, 120);
}

function serverConfig(env) {
  const url = (env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const inviteCode = env.TEACHER_INVITE_CODE || '';
  if (!url || !key) return { error: errResponse('Supabase is not configured on the server.', 503) };
  if (!inviteCode) return { error: errResponse('Teacher signup is not enabled yet.', 403) };
  return { url, key, inviteCode };
}

export function onRequestOptions() { return corsPreflight(); }

export async function onRequestPost(context) {
  const cfg = serverConfig(context.env);
  if (cfg.error) return cfg.error;

  const body = await readBody(context.request);
  const email = cleanEmail(body && body.email);
  const password = String((body && body.password) || '');
  const inviteCode = String((body && body.invite_code) || '').trim();
  const displayName = cleanName(body && body.display_name, email);

  if (!email || !email.includes('@')) return errResponse('Enter a valid email address.');
  if (password.length < 8) return errResponse('Password must be at least 8 characters.');
  if (inviteCode !== cfg.inviteCode) return errResponse('Invite code is not valid.', 403);

  let user;
  try {
    const r = await fetch(cfg.url + '/auth/v1/admin/users', {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: 'Bearer ' + cfg.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    if (!r.ok) {
      const msg = data && (data.message || data.msg || data.error_description || data.error);
      return errResponse(msg || 'Could not create the teacher account.', r.status === 422 ? 409 : 502);
    }
    user = data;
  } catch (_) {
    return errResponse('Could not create the teacher account.', 502);
  }

  if (!user || !user.id) return errResponse('Teacher account was not created.', 502);

  try {
    await sb(context.env, 'cl_profiles?on_conflict=id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: {
        id: user.id,
        role: 'teacher',
        display_name: displayName,
        email,
        preferred_language: 'en',
        active: true,
      },
    });
  } catch (e) {
    return errResponse(e.message || 'Teacher profile was not created.', 502);
  }

  return envelope({ email, display_name: displayName }, null, 201);
}
