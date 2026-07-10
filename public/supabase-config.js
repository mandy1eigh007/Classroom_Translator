// ClassLingo — shared Supabase client config (loaded by admin.html,
// teach.html, student.html AFTER the supabase-js UMD CDN script).
// The anon key is safe to ship client-side: Row Level Security enforces
// what each signed-in user can actually touch. The service_role key must
// NEVER appear here — it lives only in Cloudflare Pages env vars.
window.CLASSLINGO_SUPABASE = {
  url: 'https://lfizcpaqolckemrvsooy.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaXpjcGFxb2xja2VtcnZzb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjc4NDcsImV4cCI6MjA5MTg0Mzg0N30.a0Dv-SMYKTOFfwhkYoClanqRRhfWAQe3vz1D7OBTHec',
};
