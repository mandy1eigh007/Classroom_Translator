-- ClassLingo teacher backend (/teacher dashboard) schema.
-- All tables prefixed cl_ to match 001_classlingo_schema.sql.
--
-- NOTE: the spec table "cl_session_participants" already exists in
-- 001_classlingo_schema.sql (tied to cl_class_sessions and used by the
-- admin panel), so participants of the new cl_sessions live in
-- cl_session_attendees instead.

-- ---------- tables ----------

create table cl_classes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  teacher_id uuid references auth.users not null,
  name text not null,
  trade_focus text not null default 'General',
  default_source_language text not null default 'en',
  status text not null default 'active', -- active | archived
  last_session_at timestamptz
);

create table cl_students (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  teacher_id uuid references auth.users not null,
  name text not null,
  preferred_language text not null default 'es',
  last_active_at timestamptz
);

create table cl_class_students (
  class_id uuid references cl_classes not null,
  student_id uuid references cl_students not null,
  enrolled_at timestamptz default now(),
  primary key (class_id, student_id)
);

create table cl_material_subjects (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references auth.users not null,
  name text not null,
  sort_order int not null default 0
);

create table cl_materials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  teacher_id uuid references auth.users not null,
  class_id uuid references cl_classes,
  subject_id uuid references cl_material_subjects,
  category text,
  lesson text,
  title text not null,
  material_type text not null default 'text', -- text | link | upload | phrase_set
  source_language text not null default 'en',
  content text,
  is_published boolean not null default false
);

create table cl_material_translations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  material_id uuid references cl_materials not null,
  target_language text not null,
  translated_content text not null,
  translation_status text not null default 'pending', -- pending | complete | error
  updated_at timestamptz default now(),
  unique (material_id, target_language)
);

create table cl_sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  teacher_id uuid references auth.users not null,
  class_id uuid references cl_classes,
  session_code text not null unique,
  status text not null default 'lobby', -- lobby | active | ended
  started_at timestamptz,
  ended_at timestamptz
);

-- Spec name cl_session_participants is taken by 001 — see note at top.
create table cl_session_attendees (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references cl_sessions not null,
  student_id uuid references cl_students,
  guest_name text,
  preferred_language text not null default 'es',
  joined_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  help_flag boolean not null default false,
  help_flagged_at timestamptz
);

create table cl_session_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  session_id uuid references cl_sessions not null,
  event_type text not null, -- material_presented | student_joined | student_left | help_flagged | session_started | session_ended
  payload jsonb
);

create table cl_vocab_terms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  teacher_id uuid references auth.users not null,
  term text not null,
  category text not null default 'General',
  source_language text not null default 'en',
  translation text,
  target_language text,
  is_verified boolean not null default false
);

-- ---------- indexes ----------

create index cl_classes_teacher_idx on cl_classes (teacher_id);
create index cl_students_teacher_idx on cl_students (teacher_id);
create index cl_class_students_student_idx on cl_class_students (student_id);
create index cl_materials_teacher_idx on cl_materials (teacher_id);
create index cl_materials_class_idx on cl_materials (class_id);
create index cl_material_translations_material_idx on cl_material_translations (material_id);
create index cl_sessions_teacher_idx on cl_sessions (teacher_id);
create index cl_session_attendees_session_idx on cl_session_attendees (session_id);
create index cl_session_events_session_idx on cl_session_events (session_id);
create index cl_vocab_terms_teacher_idx on cl_vocab_terms (teacher_id);

-- ---------- RLS ----------

alter table cl_classes enable row level security;
alter table cl_students enable row level security;
alter table cl_class_students enable row level security;
alter table cl_material_subjects enable row level security;
alter table cl_materials enable row level security;
alter table cl_material_translations enable row level security;
alter table cl_sessions enable row level security;
alter table cl_session_attendees enable row level security;
alter table cl_session_events enable row level security;
alter table cl_vocab_terms enable row level security;

-- Direct teacher_id ownership
create policy "cl teacher owns classes" on cl_classes
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "cl teacher owns students" on cl_students
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "cl teacher owns material subjects" on cl_material_subjects
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "cl teacher owns materials" on cl_materials
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "cl teacher owns teach sessions" on cl_sessions
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "cl teacher owns vocab terms" on cl_vocab_terms
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Ownership through joins
create policy "cl teacher owns class rosters" on cl_class_students
  for all using (
    exists (select 1 from cl_classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from cl_classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

create policy "cl teacher owns material translations" on cl_material_translations
  for all using (
    exists (select 1 from cl_materials m where m.id = material_id and m.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from cl_materials m where m.id = material_id and m.teacher_id = auth.uid())
  );

create policy "cl teacher owns session attendees" on cl_session_attendees
  for all using (
    exists (select 1 from cl_sessions s where s.id = session_id and s.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from cl_sessions s where s.id = session_id and s.teacher_id = auth.uid())
  );

create policy "cl teacher owns session events" on cl_session_events
  for all using (
    exists (select 1 from cl_sessions s where s.id = session_id and s.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from cl_sessions s where s.id = session_id and s.teacher_id = auth.uid())
  );
