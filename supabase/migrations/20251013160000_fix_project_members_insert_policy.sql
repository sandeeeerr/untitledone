-- Fix RLS policy for project_members to allow invitation acceptance
-- Users should be able to add themselves to projects when accepting invitations

-- Drop existing policy
drop policy if exists "project_members_insert_owner_only" on "public"."project_members";

-- Create new policy that allows both project owners and invitation acceptance
create policy "project_members_insert_owner_and_invited"
on "public"."project_members"
as permissive
for insert
to authenticated
with check (
  -- Allow if user is the project owner (existing functionality)
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_members.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Allow if user is adding themselves (for invitation acceptance)
  project_members.user_id = auth.uid()
);



