begin;

create table if not exists public.project_pins (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  project_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, project_id),
  constraint project_pins_project_fkey foreign key (project_id) references public.projects (id) on delete cascade
);

alter table public.project_pins enable row level security;

-- Policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_pins' and policyname = 'Users can select their own pins'
  ) then
    create policy "Users can select their own pins"
      on public.project_pins for select
      to authenticated
      using ( user_id = (select auth.uid()) );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_pins' and policyname = 'Users can insert their own pins'
  ) then
    create policy "Users can insert their own pins"
      on public.project_pins for insert
      to authenticated
      with check ( user_id = (select auth.uid()) );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_pins' and policyname = 'Users can delete their own pins'
  ) then
    create policy "Users can delete their own pins"
      on public.project_pins for delete
      to authenticated
      using ( user_id = (select auth.uid()) );
  end if;
end$$;

create index if not exists project_pins_user_id_idx on public.project_pins(user_id);
create index if not exists project_pins_project_id_idx on public.project_pins(project_id);

commit;

/* Down (manual notes)
- drop index if exists public.project_pins_project_id_idx;
- drop index if exists public.project_pins_user_id_idx;
- drop policy if exists "Users can delete their own pins" on public.project_pins;
- drop policy if exists "Users can insert their own pins" on public.project_pins;
- drop policy if exists "Users can select their own pins" on public.project_pins;
- drop table if exists public.project_pins;
*/


