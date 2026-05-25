create or replace function public.sync_result_memory(
  target_match_id bigint,
  target_home_score integer,
  target_away_score integer,
  target_winner text,
  target_first_goal text,
  target_both_teams_scored text,
  target_total_goals text,
  target_resolved_tx_hash text,
  target_resolved_at timestamptz,
  target_is_upset_result boolean default false,
  target_chaos_outcome text default null
)
returns table (
  status text,
  match_id bigint,
  resolved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches;
  existing_result public.match_results;
begin
  select *
  into target_match
  from public.matches m
  where m.id = target_match_id
  for update;

  if target_match.id is null then
    raise exception 'match missing for id %', target_match_id;
  end if;

  select *
  into existing_result
  from public.match_results mr
  where mr.match_id = target_match_id
  for update;

  if existing_result.match_id is not null then
    update public.matches
    set
      status = 'resolved',
      resolved_at = existing_result.resolved_at,
      is_upset_result = coalesce(target_is_upset_result, is_upset_result),
      chaos_outcome = coalesce(nullif(target_chaos_outcome, ''), chaos_outcome)
    where id = target_match_id;

    return query
    select
      'already_synced'::text,
      existing_result.match_id,
      existing_result.resolved_at;
    return;
  end if;

  insert into public.match_results (
    match_id,
    contract_match_id,
    home_score,
    away_score,
    winner,
    first_goal,
    both_teams_scored,
    total_goals,
    source,
    resolved_tx_hash,
    resolved_at
  )
  values (
    target_match_id,
    target_match.contract_match_id,
    target_home_score,
    target_away_score,
    target_winner,
    target_first_goal,
    target_both_teams_scored,
    target_total_goals,
    'admin',
    target_resolved_tx_hash,
    target_resolved_at
  );

  update public.matches
  set
    status = 'resolved',
    resolved_at = target_resolved_at,
    is_upset_result = coalesce(target_is_upset_result, false),
    chaos_outcome = nullif(target_chaos_outcome, '')
  where id = target_match_id;

  return query
  select
    'synced'::text,
    target_match_id,
    target_resolved_at;
end;
$$;

revoke all on function public.sync_result_memory(bigint, integer, integer, text, text, text, text, text, timestamptz, boolean, text) from public, anon, authenticated;
grant execute on function public.sync_result_memory(bigint, integer, integer, text, text, text, text, text, timestamptz, boolean, text) to service_role;
