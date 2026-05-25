create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  wallet_address text primary key
    check (wallet_address ~* '^0x[a-f0-9]{40}$'),
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 24),
  display_name_normalized text not null unique
    check (display_name_normalized ~ '^[a-z0-9_]{3,20}$')
    check (display_name_normalized not in (
      'admin',
      'knewball',
      'xlayer',
      'xlayerofficial',
      'okx',
      'okxweb3',
      'fifa',
      'worldcup',
      'support',
      'moderator',
      'null',
      'undefined',
      'pelz',
      'pelz0x'
    )),
  country text not null
    check (char_length(trim(country)) between 2 and 64),
  ball_iq_cached integer not null default 0
    check (ball_iq_cached >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id bigint primary key,
  contract_match_id bigint not null unique,
  home_team text not null,
  away_team text not null,
  home_code text not null,
  away_code text not null,
  home_flag text,
  away_flag text,
  stage text,
  kickoff_time timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'locked', 'live', 'resolved')),
  underdog_team text,
  is_upset_result boolean not null default false,
  chaos_outcome text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null references public.profiles(wallet_address) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,
  contract_match_id bigint not null,
  winner_pick text not null
    check (winner_pick in ('home', 'draw', 'away')),
  home_score_pick integer not null
    check (home_score_pick between 0 and 99),
  away_score_pick integer not null
    check (away_score_pick between 0 and 99),
  total_goals_pick text not null
    check (total_goals_pick in ('under', 'over')),
  both_teams_scored_pick text not null
    check (both_teams_scored_pick in ('no', 'yes')),
  first_goal_pick text not null
    check (first_goal_pick in ('home', 'away', 'none')),
  lock_tx_hash text not null unique
    check (lock_tx_hash ~* '^0x[a-f0-9]{64}$'),
  locked_at timestamptz,
  contract_address text not null
    check (contract_address ~* '^0x[a-f0-9]{40}$'),
  network text not null
    check (network in ('testnet', 'mainnet')),
  claimed boolean not null default false,
  claim_tx_hash text unique
    check (claim_tx_hash is null or claim_tx_hash ~* '^0x[a-f0-9]{64}$'),
  claimed_at timestamptz,
  points_earned integer not null default 0
    check (points_earned >= 0),
  correct_count integer not null default 0
    check (correct_count between 0 and 5),
  tier text not null default 'none'
    check (tier in ('none', 'partial', 'strong_call', 'sharp_call', 'perfect_slate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_address, match_id)
);

create table if not exists public.match_results (
  match_id bigint primary key references public.matches(id) on delete cascade,
  contract_match_id bigint not null,
  home_score integer not null
    check (home_score between 0 and 99),
  away_score integer not null
    check (away_score between 0 and 99),
  winner text not null
    check (winner in ('home', 'draw', 'away')),
  first_goal text not null
    check (first_goal in ('home', 'away', 'none')),
  both_teams_scored text not null
    check (both_teams_scored in ('no', 'yes')),
  total_goals text not null
    check (total_goals in ('under', 'over')),
  source text not null default 'admin'
    check (source in ('admin', 'sports_api', 'chainlink_later')),
  external_match_id text,
  resolved_tx_hash text
    check (resolved_tx_hash is null or resolved_tx_hash ~* '^0x[a-f0-9]{64}$'),
  resolved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id text primary key,
  name text not null,
  slug text not null unique,
  rarity text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null references public.profiles(wallet_address) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  match_id bigint references public.matches(id) on delete set null,
  prediction_id uuid references public.predictions(id) on delete set null,
  awarded_at timestamptz not null default now(),
  unique (wallet_address, badge_id, match_id)
);

create table if not exists public.profile_signature_nonces (
  nonce text primary key,
  wallet_address text not null
    check (wallet_address ~* '^0x[a-f0-9]{40}$'),
  action text not null
    check (action in ('create_profile')),
  used_at timestamptz not null default now()
);

create index if not exists predictions_match_id_idx on public.predictions(match_id);
create index if not exists predictions_wallet_created_idx on public.predictions(wallet_address, created_at desc);
create index if not exists user_badges_wallet_awarded_idx on public.user_badges(wallet_address, awarded_at desc);
create unique index if not exists user_badges_first_call_once_idx
on public.user_badges(wallet_address, badge_id)
where badge_id = 'first_call';

insert into public.matches (
  id,
  contract_match_id,
  home_team,
  away_team,
  home_code,
  away_code,
  stage,
  kickoff_time
)
values
  (1, 1, 'Mexico', 'South Africa', 'MEX', 'RSA', 'Group A - Matchday 1', '2026-06-11T19:00:00Z'),
  (2, 2, 'South Korea', 'Czechia', 'KOR', 'CZE', 'Group A - Matchday 1', '2026-06-12T02:00:00Z'),
  (3, 3, 'Canada', 'Bosnia & Herzegovina', 'CAN', 'BIH', 'Group B - Matchday 2', '2026-06-12T19:00:00Z'),
  (4, 4, 'United States', 'Paraguay', 'USA', 'PAR', 'Group D - Matchday 2', '2026-06-13T01:00:00Z'),
  (5, 5, 'Qatar', 'Switzerland', 'QAT', 'SUI', 'Group B - Matchday 1', '2026-06-13T19:00:00Z'),
  (6, 6, 'Brazil', 'Japan', 'BRA', 'JPN', 'Group C - Matchday 1', '2026-06-13T22:00:00Z'),
  (7, 7, 'Haiti', 'Scotland', 'HAI', 'SCO', 'Group C - Matchday 1', '2026-06-14T01:00:00Z'),
  (8, 8, 'Australia', 'Türkiye', 'AUS', 'TUR', 'Group D - Matchday 1', '2026-06-14T04:00:00Z'),
  (9, 9, 'Germany', 'Curaçao', 'GER', 'CUW', 'Group E - Matchday 1', '2026-06-14T17:00:00Z'),
  (10, 10, 'Netherlands', 'Japan', 'NED', 'JPN', 'Group F - Matchday 1', '2026-06-14T20:00:00Z'),
  (11, 11, 'Côte d''Ivoire', 'Ecuador', 'CIV', 'ECU', 'Group E - Matchday 1', '2026-06-14T23:00:00Z'),
  (12, 12, 'Sweden', 'Tunisia', 'SWE', 'TUN', 'Group F - Matchday 1', '2026-06-15T02:00:00Z'),
  (13, 13, 'Spain', 'Cape Verde', 'ESP', 'CPV', 'Group H - Matchday 1', '2026-06-15T16:00:00Z'),
  (14, 14, 'Belgium', 'Egypt', 'BEL', 'EGY', 'Group G - Matchday 1', '2026-06-15T19:00:00Z'),
  (15, 15, 'Saudi Arabia', 'Uruguay', 'KSA', 'URU', 'Group H - Matchday 1', '2026-06-15T22:00:00Z'),
  (16, 16, 'Iran', 'New Zealand', 'IRN', 'NZL', 'Group G - Matchday 1', '2026-06-16T01:00:00Z'),
  (17, 17, 'France', 'Senegal', 'FRA', 'SEN', 'Group I - Matchday 1', '2026-06-16T19:00:00Z'),
  (18, 18, 'Iraq', 'Norway', 'IRQ', 'NOR', 'Group I - Matchday 1', '2026-06-16T22:00:00Z'),
  (19, 19, 'Argentina', 'Algeria', 'ARG', 'ALG', 'Group J - Matchday 1', '2026-06-17T01:00:00Z'),
  (20, 20, 'Austria', 'Jordan', 'AUT', 'JOR', 'Group J - Matchday 1', '2026-06-17T04:00:00Z'),
  (21, 21, 'Portugal', 'DR Congo', 'POR', 'COD', 'Group K - Matchday 1', '2026-06-17T17:00:00Z'),
  (22, 22, 'England', 'Croatia', 'ENG', 'CRO', 'Group L - Matchday 1', '2026-06-17T20:00:00Z'),
  (23, 23, 'Ghana', 'Panama', 'GHA', 'PAN', 'Group L - Matchday 1', '2026-06-17T23:00:00Z'),
  (24, 24, 'Uzbekistan', 'Colombia', 'UZB', 'COL', 'Group K - Matchday 1', '2026-06-18T02:00:00Z')
on conflict (id) do update set
  contract_match_id = excluded.contract_match_id,
  home_team = excluded.home_team,
  away_team = excluded.away_team,
  home_code = excluded.home_code,
  away_code = excluded.away_code,
  stage = excluded.stage,
  kickoff_time = excluded.kickoff_time;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists predictions_set_updated_at on public.predictions;
create trigger predictions_set_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

insert into public.badges (id, name, slug, rarity, description)
values
  ('first_call', 'First Call', 'first-call', 'Common', 'Lock your first KnewBall call on X Layer.'),
  ('knew_ball', 'Knew Ball', 'knew-ball', 'Rare', 'Land your first correct winner call.'),
  ('strong_call', 'Strong Call', 'strong-call', 'Rare', 'Three reads landed. You knew the shape of the match.'),
  ('sharp_call', 'Sharp Call', 'sharp-call', 'Elite', 'Four out of five. One detail away from perfection.'),
  ('perfect_slate', 'Perfect Slate', 'perfect-slate', 'Legendary', 'Every detail landed. No edits. No excuses.'),
  ('score_prophet', 'Score Prophet', 'score-prophet', 'Elite', 'Call the exact final score.'),
  ('first_blood', 'First Blood', 'first-blood', 'Rare', 'Call the first team to score.'),
  ('in_form', 'In Form', 'in-form', 'Elite', 'The recent reads are holding up.'),
  ('upset_hunter', 'Upset Hunter', 'upset-hunter', 'Elite', 'Call the underdog win.'),
  ('chaos_merchant', 'Chaos Merchant', 'chaos-merchant', 'Elite', 'You saw the madness coming.'),
  ('country_captain', 'Country Captain', 'country-captain', 'Legendary', 'Enter the top ten for your country.')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  rarity = excluded.rarity,
  description = excluded.description;

create or replace function public.increment_profile_ball_iq(
  target_wallet text,
  points_delta integer
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if points_delta < 0 then
    raise exception 'points_delta must be non-negative';
  end if;

  update public.profiles
  set ball_iq_cached = ball_iq_cached + points_delta
  where wallet_address = target_wallet
  returning * into updated_profile;

  if updated_profile.wallet_address is null then
    raise exception 'profile missing for wallet %', target_wallet;
  end if;

  return updated_profile;
end;
$$;

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.match_results enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.profile_signature_nonces enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "Public matches are readable" on public.matches;
create policy "Public matches are readable"
on public.matches for select
to anon, authenticated
using (true);

drop policy if exists "Public predictions are readable" on public.predictions;
create policy "Public predictions are readable"
on public.predictions for select
to anon, authenticated
using (true);

drop policy if exists "Public match results are readable" on public.match_results;
create policy "Public match results are readable"
on public.match_results for select
to anon, authenticated
using (true);

drop policy if exists "Public badges are readable" on public.badges;
create policy "Public badges are readable"
on public.badges for select
to anon, authenticated
using (true);

drop policy if exists "Public user badges are readable" on public.user_badges;
create policy "Public user badges are readable"
on public.user_badges for select
to anon, authenticated
using (true);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.matches from anon, authenticated;
revoke all on table public.predictions from anon, authenticated;
revoke all on table public.match_results from anon, authenticated;
revoke all on table public.badges from anon, authenticated;
revoke all on table public.user_badges from anon, authenticated;
revoke all on table public.profile_signature_nonces from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.matches to anon, authenticated;
grant select on table public.predictions to anon, authenticated;
grant select on table public.match_results to anon, authenticated;
grant select on table public.badges to anon, authenticated;
grant select on table public.user_badges to anon, authenticated;

revoke all on function public.increment_profile_ball_iq(text, integer) from public, anon, authenticated;
grant execute on function public.increment_profile_ball_iq(text, integer) to service_role;

create or replace function public.sync_claim_memory(
  target_wallet text,
  target_match_id bigint,
  target_claim_tx_hash text,
  target_claimed_at timestamptz,
  target_points_earned integer,
  target_correct_count integer,
  target_tier text,
  target_badge_ids text[]
)
returns table (
  status text,
  prediction_id uuid,
  points_earned integer,
  correct_count integer,
  tier text,
  badges_awarded text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_prediction public.predictions;
  awarded_ids text[] := '{}'::text[];
  next_badge_id text;
begin
  if target_points_earned < 0 then
    raise exception 'points earned must be non-negative';
  end if;

  select *
  into target_prediction
  from public.predictions
  where wallet_address = lower(target_wallet)
    and match_id = target_match_id
  for update;

  if target_prediction.id is null then
    raise exception 'prediction not synced for wallet % and match %', target_wallet, target_match_id;
  end if;

  if target_prediction.claimed then
    return query
    select
      'already_synced'::text,
      target_prediction.id,
      target_prediction.points_earned,
      target_prediction.correct_count,
      target_prediction.tier,
      coalesce((
        select array_agg(ub.badge_id order by ub.badge_id)
        from public.user_badges ub
        where ub.prediction_id = target_prediction.id
      ), '{}'::text[]);
    return;
  end if;

  update public.predictions
  set
    claimed = true,
    claim_tx_hash = target_claim_tx_hash,
    claimed_at = target_claimed_at,
    points_earned = target_points_earned,
    correct_count = target_correct_count,
    tier = target_tier
  where id = target_prediction.id;

  perform public.increment_profile_ball_iq(lower(target_wallet), target_points_earned);

  foreach next_badge_id in array coalesce(target_badge_ids, '{}'::text[])
  loop
    insert into public.user_badges (
      wallet_address,
      badge_id,
      match_id,
      prediction_id
    )
    values (
      lower(target_wallet),
      next_badge_id,
      target_match_id,
      target_prediction.id
    )
    on conflict (wallet_address, badge_id, match_id) do nothing;

    if found then
      awarded_ids := array_append(awarded_ids, next_badge_id);
    end if;
  end loop;

  return query
  select
    'synced'::text,
    target_prediction.id,
    target_points_earned,
    target_correct_count,
    target_tier,
    awarded_ids;
end;
$$;

revoke all on function public.sync_claim_memory(text, bigint, text, timestamptz, integer, integer, text, text[]) from public, anon, authenticated;
grant execute on function public.sync_claim_memory(text, bigint, text, timestamptz, integer, integer, text, text[]) to service_role;

create or replace function public.sync_prediction_memory(
  target_wallet text,
  target_match_id bigint,
  target_winner_pick text,
  target_home_score_pick integer,
  target_away_score_pick integer,
  target_total_goals_pick text,
  target_both_teams_scored_pick text,
  target_first_goal_pick text,
  target_lock_tx_hash text,
  target_locked_at timestamptz,
  target_contract_address text,
  target_network text
)
returns table (
  status text,
  prediction_id uuid,
  wallet_address text,
  match_id bigint,
  lock_tx_hash text,
  locked_at timestamptz,
  badges_awarded text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_prediction public.predictions;
  first_call_awarded boolean := false;
begin
  select *
  into target_prediction
  from public.predictions p
  where p.wallet_address = lower(target_wallet)
    and p.match_id = target_match_id
  for update;

  if target_prediction.id is not null then
    return query
    select
      'already_synced'::text,
      target_prediction.id,
      target_prediction.wallet_address,
      target_prediction.match_id,
      target_prediction.lock_tx_hash,
      target_prediction.locked_at,
      coalesce((
        select array_agg(ub.badge_id order by ub.badge_id)
        from public.user_badges ub
        where ub.prediction_id = target_prediction.id
      ), '{}'::text[]);
    return;
  end if;

  insert into public.predictions (
    wallet_address,
    match_id,
    contract_match_id,
    winner_pick,
    home_score_pick,
    away_score_pick,
    total_goals_pick,
    both_teams_scored_pick,
    first_goal_pick,
    lock_tx_hash,
    locked_at,
    contract_address,
    network
  )
  values (
    lower(target_wallet),
    target_match_id,
    target_match_id,
    target_winner_pick,
    target_home_score_pick,
    target_away_score_pick,
    target_total_goals_pick,
    target_both_teams_scored_pick,
    target_first_goal_pick,
    target_lock_tx_hash,
    target_locked_at,
    lower(target_contract_address),
    target_network
  )
  on conflict (wallet_address, match_id) do nothing
  returning * into target_prediction;

  if target_prediction.id is null then
    select *
    into target_prediction
    from public.predictions p
    where p.wallet_address = lower(target_wallet)
      and p.match_id = target_match_id;

    return query
    select
      'already_synced'::text,
      target_prediction.id,
      target_prediction.wallet_address,
      target_prediction.match_id,
      target_prediction.lock_tx_hash,
      target_prediction.locked_at,
      '{}'::text[];
    return;
  end if;

  insert into public.user_badges (
    wallet_address,
    badge_id,
    match_id,
    prediction_id
  )
  values (
    lower(target_wallet),
    'first_call',
    target_match_id,
    target_prediction.id
  )
  on conflict do nothing;

  first_call_awarded := found;

  return query
  select
    'synced'::text,
    target_prediction.id,
    target_prediction.wallet_address,
    target_prediction.match_id,
    target_prediction.lock_tx_hash,
    target_prediction.locked_at,
    case when first_call_awarded then array['first_call']::text[] else '{}'::text[] end;
end;
$$;

revoke all on function public.sync_prediction_memory(text, bigint, text, integer, integer, text, text, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.sync_prediction_memory(text, bigint, text, integer, integer, text, text, text, text, timestamptz, text, text) to service_role;
