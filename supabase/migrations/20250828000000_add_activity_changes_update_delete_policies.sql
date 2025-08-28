begin;

-- Add UPDATE and DELETE policies for activity_changes table
-- This allows authors to edit and delete their own feedback changes

-- UPDATE policy: Authors can update their own activity changes
create policy "Authors can update their own activity changes"
on public.activity_changes
for update
to authenticated
using (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.project_versions pv
    join public.projects p on p.id = pv.project_id
    where pv.id = version_id and (
      not p.is_private or 
      p.owner_id = (select auth.uid()) or
      exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = (select auth.uid())
      )
    )
  )
)
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.project_versions pv
    join public.projects p on p.id = pv.project_id
    where pv.id = version_id and (
      not p.is_private or 
      p.owner_id = (select auth.uid()) or
      exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = (select auth.uid())
      )
    )
  )
);

-- DELETE policy: Authors can delete their own activity changes
create policy "Authors can delete their own activity changes"
on public.activity_changes
for delete
to authenticated
using (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.project_versions pv
    join public.projects p on p.id = pv.project_id
    where pv.id = version_id and (
      not p.is_private or 
      p.owner_id = (select auth.uid()) or
      exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = (select auth.uid())
      )
    )
  )
);

commit;

/* Down migration (manual notes)
- drop policy if exists "Authors can update their own activity changes" on public.activity_changes;
- drop policy if exists "Authors can delete their own activity changes" on public.activity_changes;
*/
