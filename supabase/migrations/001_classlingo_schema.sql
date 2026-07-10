-- ClassLingo schema — organizations, profiles, sessions, messages,
-- phrasebook, participants. Apply with `supabase db push` (project:
-- lfizcpaqolckemrvsooy / 2BlackFeathers).

-- Organizations (schools, companies, programs)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text default 'free',
  created_at timestamptz default now()
);

-- User profiles (all roles)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  role text not null check (role in ('admin', 'teacher', 'student')),
  display_name text,
  preferred_language text default 'en',
  email text,
  created_at timestamptz default now()
);

-- Class sessions
create table if not exists class_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id),
  organization_id uuid references organizations(id),
  class_code text unique not null,
  title text,
  mode text default 'general',
  status text default 'active',
  languages text[] default '{}',
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Session messages (full transcript)
create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references class_sessions(id) on delete cascade,
  speaker_id uuid references profiles(id),
  original_text text not null,
  translations jsonb default '{}',
  message_type text default 'speech',
  created_at timestamptz default now()
);

-- Student phrasebook
create table if not exists phrasebook_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  original_text text not null,
  translation text not null,
  language text not null,
  created_at timestamptz default now()
);

-- Session participants
create table if not exists session_participants (
  session_id uuid references class_sessions(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  language text,
  primary key (session_id, student_id)
);

-- RLS policies
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table class_sessions enable row level security;
alter table session_messages enable row level security;
alter table phrasebook_entries enable row level security;
alter table session_participants enable row level security;

-- Profiles: users can read their own, admins can read all
create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "admins read all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- Sessions: teachers manage their own, students can read active ones
create policy "teachers manage own sessions" on class_sessions for all using (teacher_id = auth.uid());
create policy "students read active sessions" on class_sessions for select using (status = 'active');

-- Messages: anyone in session can read, teacher/system inserts
create policy "session messages readable" on session_messages for select using (true);
create policy "insert messages" on session_messages for insert with check (auth.uid() = speaker_id);

-- Phrasebook: students manage their own
create policy "students manage phrasebook" on phrasebook_entries for all using (student_id = auth.uid());

-- Participants: manageable by owner, readable by teacher
create policy "participants insert self" on session_participants for insert with check (student_id = auth.uid());
create policy "participants read" on session_participants for select using (true);
create policy "participants update self" on session_participants for update using (student_id = auth.uid());
