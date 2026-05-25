alter table public.matches
  add column if not exists external_provider text default 'api-football',
  add column if not exists external_match_id text;

create index if not exists matches_external_match_id_idx
  on public.matches (external_match_id)
  where external_match_id is not null;

create index if not exists matches_external_provider_idx
  on public.matches (external_provider);
