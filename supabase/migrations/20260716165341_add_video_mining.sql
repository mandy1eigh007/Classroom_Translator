-- Autonomous trade-language mining for ClassLingo.
-- Full transcripts and evidence remain admin-only. The translation runtime
-- receives a compiled glossary of active phrases through server-side KV.

create table public.cl_trade_phrases (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  normalized_phrase text not null,
  variants text[] not null default '{}',
  trade text not null default 'General',
  category text not null default 'Shop talk',
  plain_english_meaning text not null,
  translation_warning text,
  example_usage text,
  region text not null default 'US trades',
  confidence numeric(5,4) not null default 0 check (confidence between 0 and 1),
  independent_source_count integer not null default 0 check (independent_source_count >= 0),
  active boolean not null default true,
  auto_published boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_phrase, trade, region)
);

create table public.cl_video_sources (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text unique,
  url text,
  title text,
  channel_id text,
  channel_name text,
  published_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  thumbnail_url text,
  discovery_query text,
  discovery_mode text not null default 'manual_url'
    check (discovery_mode in ('youtube_search', 'manual_url', 'manual_transcript')),
  source_quality numeric(5,4) not null default 0.75 check (source_quality between 0 and 1),
  selected boolean not null default true,
  transcript_source text check (transcript_source in ('captions', 'manual')),
  transcript_language text,
  transcript_text text,
  transcript_hash text,
  transcript_status text not null default 'queued'
    check (transcript_status in ('queued', 'pulling', 'ready', 'no_captions', 'error')),
  processing_status text not null default 'queued'
    check (processing_status in ('queued', 'extracting', 'complete', 'needs_attention', 'error', 'skipped')),
  error_code text,
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  selected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cl_video_vocab_candidates (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  normalized_phrase text not null,
  variants text[] not null default '{}',
  trade text not null default 'General',
  category text not null default 'Shop talk',
  plain_english_meaning text not null,
  translation_warning text,
  example_usage text,
  region text not null default 'US trades',
  confidence numeric(5,4) not null default 0 check (confidence between 0 and 1),
  independent_source_count integer not null default 0 check (independent_source_count >= 0),
  status text not null default 'candidate'
    check (status in ('candidate', 'auto_published', 'needs_attention', 'rejected')),
  attention_reason text,
  published_phrase_id uuid references public.cl_trade_phrases(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_phrase, trade, region)
);

create table public.cl_trade_phrase_evidence (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.cl_video_vocab_candidates(id) on delete cascade,
  source_id uuid not null references public.cl_video_sources(id) on delete cascade,
  context_quote text not null,
  timestamp_seconds numeric(12,3) check (timestamp_seconds is null or timestamp_seconds >= 0),
  model_confidence numeric(5,4) not null check (model_confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (candidate_id, source_id)
);

create table public.cl_trade_phrase_translations (
  id uuid primary key default gen_random_uuid(),
  phrase_id uuid not null references public.cl_trade_phrases(id) on delete cascade,
  target_language text not null,
  translation text not null,
  intent_notes text,
  confidence numeric(5,4) not null default 0 check (confidence between 0 and 1),
  status text not null default 'generated'
    check (status in ('generated', 'verified', 'needs_attention', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phrase_id, target_language)
);

create table public.cl_video_mining_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('scheduled', 'manual', 'search')),
  status text not null default 'running'
    check (status in ('running', 'complete', 'partial', 'error')),
  search_query text,
  model text,
  videos_found integer not null default 0,
  videos_processed integer not null default 0,
  transcripts_ready integer not null default 0,
  candidates_found integer not null default 0,
  auto_published integer not null default 0,
  needs_attention integer not null default 0,
  error_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  triggered_by uuid references auth.users(id) on delete set null
);

create index cl_video_sources_queue_idx
  on public.cl_video_sources (processing_status, transcript_status, created_at);
create index cl_video_sources_channel_idx on public.cl_video_sources (channel_id);
create index cl_video_candidates_status_idx
  on public.cl_video_vocab_candidates (status, confidence desc, independent_source_count desc);
create index cl_trade_phrases_active_idx on public.cl_trade_phrases (active, trade);
create index cl_trade_evidence_candidate_idx on public.cl_trade_phrase_evidence (candidate_id);
create index cl_video_runs_started_idx on public.cl_video_mining_runs (started_at desc);

alter table public.cl_trade_phrases enable row level security;
alter table public.cl_video_sources enable row level security;
alter table public.cl_video_vocab_candidates enable row level security;
alter table public.cl_trade_phrase_evidence enable row level security;
alter table public.cl_trade_phrase_translations enable row level security;
alter table public.cl_video_mining_runs enable row level security;

create policy "cl admins manage trade phrases" on public.cl_trade_phrases
  for all to authenticated using (public.cl_is_admin()) with check (public.cl_is_admin());
create policy "cl admins manage video sources" on public.cl_video_sources
  for all to authenticated using (public.cl_is_admin()) with check (public.cl_is_admin());
create policy "cl admins manage video candidates" on public.cl_video_vocab_candidates
  for all to authenticated using (public.cl_is_admin()) with check (public.cl_is_admin());
create policy "cl admins manage phrase evidence" on public.cl_trade_phrase_evidence
  for all to authenticated using (public.cl_is_admin()) with check (public.cl_is_admin());
create policy "cl admins manage phrase translations" on public.cl_trade_phrase_translations
  for all to authenticated using (public.cl_is_admin()) with check (public.cl_is_admin());
create policy "cl admins read mining runs" on public.cl_video_mining_runs
  for select to authenticated using (public.cl_is_admin());

-- Supabase no longer guarantees automatic Data API grants for new tables.
-- RLS remains the authorization boundary; anon receives no access.
grant select, insert, update, delete on public.cl_trade_phrases to authenticated;
grant select, insert, update, delete on public.cl_video_sources to authenticated;
grant select, insert, update, delete on public.cl_video_vocab_candidates to authenticated;
grant select, insert, update, delete on public.cl_trade_phrase_evidence to authenticated;
grant select, insert, update, delete on public.cl_trade_phrase_translations to authenticated;
grant select on public.cl_video_mining_runs to authenticated;
grant all on public.cl_trade_phrases, public.cl_video_sources,
  public.cl_video_vocab_candidates, public.cl_trade_phrase_evidence,
  public.cl_trade_phrase_translations, public.cl_video_mining_runs to service_role;

insert into public.cl_app_settings (key, value)
values (
  'video_mining',
  '{"automation_enabled":false,"trades":["Construction","Carpentry","Electrical","Plumbing","HVAC","Safety","Flagging","Forklift"],"trusted_channels":[],"blocked_channels":[],"search_terms":["construction training","carpentry training","electrical apprenticeship","plumbing apprenticeship","jobsite safety"],"max_videos_per_run":3,"minimum_independent_sources":3,"minimum_confidence":0.9,"captions_required":true}'::jsonb
)
on conflict (key) do nothing;
