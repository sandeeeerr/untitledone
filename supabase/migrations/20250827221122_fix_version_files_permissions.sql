begin;

--
-- Fix version_files permissions to allow project members to link files to versions
-- Currently only project owners can create version_files records
-- This prevents project members from uploading files to specific versions
--

-- Drop the existing restrictive policy
drop policy if exists "Project owners can manage version files" on public.version_files;

-- Create new policy that allows project members to insert version_files
create policy "Project members can manage version files"
on public.version_files
for all
to authenticated
using (
  exists (
    select 1 from public.project_versions pv
    join public.projects p on p.id = pv.project_id
    where pv.id = version_files.version_id and (
      p.owner_id = auth.uid() or
      exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid()
      )
    )
  )
)
with check (
  exists (
    select 1 from public.project_versions pv
    join public.projects p on p.id = pv.project_id
    where pv.id = version_files.version_id and (
      p.owner_id = auth.uid() or
      exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid()
      )
    )
  )
);

commit;

/* Down (manual notes)
- drop policy if exists "Project members can manage version files" on public.version_files;
- create policy "Project owners can manage version files" on version_files for all to authenticated
  using (EXISTS (SELECT 1 FROM project_versions pv JOIN projects p ON p.id = pv.project_id 
         WHERE pv.id = version_id AND p.owner_id = auth.uid()));
*/
