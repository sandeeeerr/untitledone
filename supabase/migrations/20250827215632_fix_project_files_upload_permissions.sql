begin;

--
-- Fix project_files upload permissions to include project members
-- Currently only project owners can upload files to private projects
-- This should also allow project members to upload files
--

-- Drop the existing restrictive policy
drop policy if exists "Users can upload files to projects they have access to" on public.project_files;

-- Create new policy that includes project members
create policy "Users can upload files to projects they have access to"
on public.project_files
for insert
to authenticated
with check (
  exists (
    select 1 from public.projects 
    where id = project_files.project_id and (
      not is_private or 
      owner_id = auth.uid() or
      exists (
        select 1 from public.project_members 
        where project_id = projects.id and user_id = auth.uid()
      )
    )
  )
);

commit;

/* Down (manual notes)
- drop policy if exists "Users can upload files to projects they have access to" on public.project_files;
- create policy "Users can upload files to projects they have access to"
  on public.project_files for insert to authenticated
  with check ((EXISTS ( SELECT 1 FROM projects
    WHERE ((projects.id = project_files.project_id) AND ((NOT projects.is_private) OR (projects.owner_id = auth.uid()))))));
*/
