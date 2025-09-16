begin;

-- Create a private storage bucket for project files (idempotent)
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'project-files') then
    insert into storage.buckets (id, name, public)
    values ('project-files', 'project-files', false);
  end if;
end$$;

-- RLS policies on storage.objects for the project-files bucket
-- Keep it simple for MVP: any authenticated user can read/write.
-- API routes will enforce project-level permissions.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'project-files read authenticated'
      and schemaname = 'storage' and tablename = 'objects'
  ) then
    create policy "project-files read authenticated"
      on storage.objects for select
      to authenticated
      using (bucket_id = 'project-files');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'project-files insert authenticated'
      and schemaname = 'storage' and tablename = 'objects'
  ) then
    create policy "project-files insert authenticated"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'project-files');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'project-files update authenticated'
      and schemaname = 'storage' and tablename = 'objects'
  ) then
    create policy "project-files update authenticated"
      on storage.objects for update
      to authenticated
      using (bucket_id = 'project-files');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'project-files delete authenticated'
      and schemaname = 'storage' and tablename = 'objects'
  ) then
    create policy "project-files delete authenticated"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'project-files');
  end if;
end$$;

commit;

/* Down (manual notes)
- delete policy "project-files delete authenticated" on storage.objects;
- delete policy "project-files update authenticated" on storage.objects;
- delete policy "project-files insert authenticated" on storage.objects;
- delete policy "project-files read authenticated" on storage.objects;
- delete from storage.buckets where id = 'project-files';
*/


