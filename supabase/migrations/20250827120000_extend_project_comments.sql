begin;

--
-- Extend project_comments to support threads, activity linkage, timecodes (audio-only), and status flags
--

-- Columns
alter table public.project_comments
  add column if not exists parent_id uuid references public.project_comments(id) on delete cascade;

alter table public.project_comments
  add column if not exists activity_change_id uuid references public.activity_changes(id) on delete cascade;

alter table public.project_comments
  add column if not exists timestamp_ms numeric;

alter table public.project_comments
  add column if not exists edited boolean not null default false;

alter table public.project_comments
  add column if not exists resolved boolean not null default false;

alter table public.project_comments
  add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

-- Indexes
create index if not exists idx_project_comments_project_id on public.project_comments(project_id);
create index if not exists idx_project_comments_parent_id on public.project_comments(parent_id);
create index if not exists idx_project_comments_activity_change_id on public.project_comments(activity_change_id);
create index if not exists idx_project_comments_version_id on public.project_comments(version_id);
create index if not exists idx_project_comments_file_id on public.project_comments(file_id);
create index if not exists idx_project_comments_created_at on public.project_comments(created_at);

-- Ensure RLS is enabled
alter table public.project_comments enable row level security;

-- Trigger: mark edited when comment text changes and maintain updated_at
create or replace function public.mark_project_comment_edited()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.comment is distinct from old.comment then
      new.edited := true;
    end if;
    new.updated_at := timezone('utc'::text, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_comments_mark_edited on public.project_comments;
create trigger trg_project_comments_mark_edited
before update on public.project_comments
for each row execute function public.mark_project_comment_edited();

-- Constraint: timestamp_ms only allowed when attached file is audio/*
create or replace function public.ensure_timecode_only_for_audio()
returns trigger
language plpgsql
as $$
declare
  v_type text;
begin
  if (new.timestamp_ms is not null) then
    if new.file_id is null then
      raise exception 'timestamp_ms requires file_id';
    end if;
    select pf.file_type into v_type from public.project_files pf where pf.id = new.file_id;
    if v_type is null or position('audio/' in v_type) <> 1 then
      raise exception 'timestamp_ms is only allowed for audio files (file_type audio/*)';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_comments_timecode_guard on public.project_comments;
create trigger trg_project_comments_timecode_guard
before insert or update on public.project_comments
for each row execute function public.ensure_timecode_only_for_audio();

-- RLS Policies
--
-- Read access:
--  - Public projects: anyone (anon + authenticated) may read
--  - Private projects: only project members may read
-- Insert/Update/Delete:
--  - Public projects: any authenticated user may insert; only author may update/delete
--  - Private projects: only members may insert; only author may update/delete

-- Helper predicate: project is public
create or replace view public._project_visibility as
  select id as project_id, coalesce(not is_private, true) as is_public
  from public.projects;

-- SELECT (authenticated)
drop policy if exists "project_comments_authenticated_can_read" on public.project_comments;
create policy "project_comments_authenticated_can_read"
on public.project_comments
for select
to authenticated
using (
  exists (
    select 1 from public._project_visibility pv
    where pv.project_id = project_comments.project_id
      and pv.is_public
  )
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = project_comments.project_id
      and pm.user_id = auth.uid()
  )
);

-- SELECT (anon)
drop policy if exists "project_comments_anon_can_read_public" on public.project_comments;
create policy "project_comments_anon_can_read_public"
on public.project_comments
for select
to anon
using (
  exists (
    select 1 from public._project_visibility pv
    where pv.project_id = project_comments.project_id
      and pv.is_public
  )
);

-- INSERT
drop policy if exists "project_comments_authenticated_can_insert" on public.project_comments;
create policy "project_comments_authenticated_can_insert"
on public.project_comments
for insert
to authenticated
with check (
  (exists (
    select 1 from public._project_visibility pv
    where pv.project_id = project_comments.project_id
      and pv.is_public
  ))
  or (exists (
    select 1 from public.project_members pm
    where pm.project_id = project_comments.project_id
      and pm.user_id = auth.uid()
  ))
);

-- UPDATE (author only)
drop policy if exists "project_comments_author_can_update" on public.project_comments;
create policy "project_comments_author_can_update"
on public.project_comments
for update
to authenticated
using (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public._project_visibility pv
      where pv.project_id = project_comments.project_id
        and pv.is_public
    )
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = project_comments.project_id
        and pm.user_id = auth.uid()
    )
  )
)
with check (user_id = auth.uid());

-- DELETE (author only)
drop policy if exists "project_comments_author_can_delete" on public.project_comments;
create policy "project_comments_author_can_delete"
on public.project_comments
for delete
to authenticated
using (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public._project_visibility pv
      where pv.project_id = project_comments.project_id
        and pv.is_public
    )
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = project_comments.project_id
        and pm.user_id = auth.uid()
    )
  )
);

commit;

/* Down (manual notes)
- drop policy if exists project_comments_author_can_delete on public.project_comments;
- drop policy if exists project_comments_author_can_update on public.project_comments;
- drop policy if exists project_comments_authenticated_can_insert on public.project_comments;
- drop policy if exists project_comments_anon_can_read_public on public.project_comments;
- drop policy if exists project_comments_authenticated_can_read on public.project_comments;
- drop trigger if exists trg_project_comments_timecode_guard on public.project_comments;
- drop function if exists public.ensure_timecode_only_for_audio();
- drop trigger if exists trg_project_comments_mark_edited on public.project_comments;
- drop function if exists public.mark_project_comment_edited();
- drop index if exists idx_project_comments_created_at;
- drop index if exists idx_project_comments_file_id;
- drop index if exists idx_project_comments_activity_change_id;
- drop index if exists idx_project_comments_parent_id;
- drop index if exists idx_project_comments_project_id;
- alter table public.project_comments drop column if exists updated_at;
- alter table public.project_comments drop column if exists resolved;
- alter table public.project_comments drop column if exists edited;
- alter table public.project_comments drop column if exists timestamp_ms;
- alter table public.project_comments drop column if exists activity_change_id;
- alter table public.project_comments drop column if exists parent_id;
- drop view if exists public._project_visibility;
*/


