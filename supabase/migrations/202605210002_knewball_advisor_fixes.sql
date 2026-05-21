create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists user_badges_badge_id_idx
on public.user_badges(badge_id);

create index if not exists user_badges_match_id_idx
on public.user_badges(match_id);

create index if not exists user_badges_prediction_id_idx
on public.user_badges(prediction_id);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
