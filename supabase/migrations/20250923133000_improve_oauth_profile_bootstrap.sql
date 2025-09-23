begin;

-- Improve new-user bootstrap from OAuth metadata (Google, etc.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_display text;
  generated_username text;
  avatar text;
begin
  -- Prefer full_name/name from OAuth; fallback to email local-part
  base_display := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  avatar := coalesce(
    new.raw_user_meta_data->>'picture',
    new.raw_user_meta_data->>'avatar_url',
    null
  );

  generated_username := public.generate_unique_username(base_display);

  insert into public.profiles (id, username, display_name, avatar_url, updated_at)
  values (
    new.id,
    generated_username,
    base_display,
    avatar,
    now()
  )
  on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name,
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end
$$;

-- Optional: backfill/repair existing profiles with better values from auth.users
do $$
declare r record;
begin
  for r in (
    select p.id,
           p.username,
           p.display_name,
           p.avatar_url,
           u.email,
           coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)) as base_display,
           coalesce(u.raw_user_meta_data->>'picture', u.raw_user_meta_data->>'avatar_url') as pic
    from public.profiles p
    join auth.users u on u.id = p.id
  ) loop
    if (
      r.username is null
      or r.username = lower(regexp_replace(r.email, '[^a-zA-Z0-9]', '', 'g'))
    ) or r.display_name is null or (r.avatar_url is null and r.pic is not null) then
      update public.profiles p
      set username = case when (r.username is null or r.username = lower(regexp_replace(r.email, '[^a-zA-Z0-9]', '', 'g'))) then public.generate_unique_username(r.base_display) else p.username end,
          display_name = coalesce(p.display_name, r.base_display),
          avatar_url = coalesce(p.avatar_url, r.pic),
          updated_at = now()
      where p.id = r.id;
    end if;
  end loop;
end $$;

commit;

/* Down (manual notes)
- Recreate previous public.handle_new_user if needed
*/


