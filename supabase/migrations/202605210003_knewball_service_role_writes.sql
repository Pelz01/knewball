grant select, insert, update, delete
on table
  public.profiles,
  public.matches,
  public.predictions,
  public.match_results,
  public.badges,
  public.user_badges,
  public.profile_signature_nonces
to service_role;
