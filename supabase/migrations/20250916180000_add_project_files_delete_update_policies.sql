begin;

-- Allow owners or original uploaders to update/delete project_files

-- DELETE policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Users can delete their own or owner can delete project files'
      and schemaname = 'public' and tablename = 'project_files'
  ) then
    create policy "Users can delete their own or owner can delete project files"
      on public.project_files for delete
      to authenticated
      using (
        (exists (
          select 1 from public.projects p
          where p.id = project_files.project_id and p.owner_id = auth.uid()
        ))
        or (project_files.uploaded_by = auth.uid())
      );
  end if;
end$$;

-- UPDATE policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Users can update their own or owner can update project files'
      and schemaname = 'public' and tablename = 'project_files'
  ) then
    create policy "Users can update their own or owner can update project files"
      on public.project_files for update
      to authenticated
      using (
        (exists (
          select 1 from public.projects p
          where p.id = project_files.project_id and p.owner_id = auth.uid()
        ))
        or (project_files.uploaded_by = auth.uid())
      )
      with check (
        (exists (
          select 1 from public.projects p
          where p.id = project_files.project_id and p.owner_id = auth.uid()
        ))
        or (project_files.uploaded_by = auth.uid())
      );
  end if;
end$$;

commit;

/* Down (manual notes)
- drop policy if exists "Users can delete their own or owner can delete project files" on public.project_files;
- drop policy if exists "Users can update their own or owner can update project files" on public.project_files;
*/


