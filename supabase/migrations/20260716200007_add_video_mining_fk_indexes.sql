create index cl_trade_evidence_source_idx
  on public.cl_trade_phrase_evidence (source_id);
create index cl_video_runs_triggered_by_idx
  on public.cl_video_mining_runs (triggered_by);
create index cl_video_sources_selected_by_idx
  on public.cl_video_sources (selected_by);
create index cl_video_candidates_published_phrase_idx
  on public.cl_video_vocab_candidates (published_phrase_id);
