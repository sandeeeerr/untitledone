begin;

--
-- Fix project_files SELECT permissions to include project members  
-- Currently only project owners can view files in private projects
-- This should also allow project members to view files
--

-- Drop the existing restrictive SELECT policy
drop policy if exists "Users can view files of projects they have access to" on public.project_files;

-- Create new SELECT policy that includes project members
create policy "Users can view files of projects they have access to"
on public.project_files
for select
to authenticated
using (
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
- drop policy if exists "Users can view files of projects they have access to" on public.project_files;
- create policy "Users can view files of projects they have access to"
  on public.project_files for select to authenticated
  using ((EXISTS ( SELECT 1 FROM projects
    WHERE ((projects.id = project_files.project_id) AND ((NOT projects.is_private) OR (projects.owner_id = auth.uid()))))));
*/
