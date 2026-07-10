-- ClassLingo schema — all tables prefixed cl_ to avoid collisions
-- with existing tables in the 2BlackFeathers project.
-- Applied 2026-07-10 via MCP apply_migration.

create table if not exists cl_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text default 'free',
  created_at timestamptz default now()
);

create table if not exists cl_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references cl_organizations(id),
  role text not null check (role in ('admin', 'teacher', 'student')),
  display_name text,
  preferred_language text default 'en',
  email text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists cl_class_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references cl_profiles(id),
  organization_id uuid references cl_organizations(id),
  class_code text unique not null,
  title text,
  mode text default 'general',
  status text default 'active',
  languages text[] default '{}',
  started_at timestamptz default now(),
  ended_at timestamptz
);

create table if not exists cl_session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references cl_class_sessions(id) on delete cascade,
  speaker_id uuid references cl_profiles(id),
  original_text text not null,
  translations jsonb default '{}',
  message_type text default 'speech',
  created_at timestamptz default now()
);

create table if not exists cl_phrasebook_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references cl_profiles(id) on delete cascade,
  original_text text not null,
  translation text not null,
  language text not null,
  created_at timestamptz default now()
);

create table if not exists cl_session_participants (
  session_id uuid references cl_class_sessions(id) on delete cascade,
  student_id uuid references cl_profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  language text,
  primary key (session_id, student_id)
);

create table if not exists cl_app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- SECURITY DEFINER avoids RLS recursion when policies subquery cl_profiles
create or replace function public.cl_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from cl_profiles where id = auth.uid() and role = 'admin');
$$;

alter table cl_organizations enable row level security;
alter table cl_profiles enable row level security;
alter table cl_class_sessions enable row level security;
alter table cl_session_messages enable row level security;
alter table cl_phrasebook_entries enable row level security;
alter table cl_session_participants enable row level security;
alter table cl_app_settings enable row level security;

create policy "cl admins manage organizations" on cl_organizations for all using (public.cl_is_admin());
create policy "cl authenticated read organizations" on cl_organizations for select to authenticated using (true);

create policy "cl users read own profile" on cl_profiles for select using (auth.uid() = id);
create policy "cl admins read all profiles" on cl_profiles for select using (public.cl_is_admin());
create policy "cl users update own profile" on cl_profiles for update using (auth.uid() = id);
create policy "cl users insert own profile" on cl_profiles for insert with check (auth.uid() = id);
create policy "cl admins update profiles" on cl_profiles for update using (public.cl_is_admin());

create policy "cl teachers manage own sessions" on cl_class_sessions for all using (teacher_id = auth.uid());
create policy "cl students read active sessions" on cl_class_sessions for select using (status = 'active');
create policy "cl admins read all sessions" on cl_class_sessions for select using (public.cl_is_admin());

create policy "cl session messages readable" on cl_session_messages for select using (true);
create policy "cl insert messages" on cl_session_messages for insert with check (auth.uid() = speaker_id);

create policy "cl students manage phrasebook" on cl_phrasebook_entries for all using (student_id = auth.uid());

create policy "cl participants insert self" on cl_session_participants for insert with check (student_id = auth.uid());
create policy "cl participants read" on cl_session_participants for select using (true);
create policy "cl participants update self" on cl_session_participants for update using (student_id = auth.uid());

create policy "cl admins manage settings" on cl_app_settings for all using (public.cl_is_admin());
create policy "cl authenticated read settings" on cl_app_settings for select to authenticated using (true);
