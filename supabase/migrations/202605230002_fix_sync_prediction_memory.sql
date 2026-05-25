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
  on conflict on constraint predictions_wallet_address_match_id_key do nothing
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
