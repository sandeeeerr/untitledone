begin;

-- Allow members to remove themselves from a project (leave)
-- Members can only leave if they are NOT the owner
create policy "Members can leave projects they are part of (not owner)"
on public.project_members
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and not exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = user_id
  )
);

commit;

/* Down (manual notes)
- drop policy "Members can leave projects they are part of (not owner)" on public.project_members;
*/

