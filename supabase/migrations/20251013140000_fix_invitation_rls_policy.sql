-- Fix RLS policy for project_invitations to allow invited users to see their own invitations
-- This allows the pending invitations API to work properly

-- Drop existing policies first to avoid conflicts
drop policy if exists "project_invitations_select_invited_user" on "public"."project_invitations";
drop policy if exists "project_invitations_update_invited_user" on "public"."project_invitations";

-- Add policy for invited users to see their own invitations
-- Use auth.jwt() to get the email instead of querying auth.users table
create policy "project_invitations_select_invited_user"
on "public"."project_invitations"
as permissive
for select
to authenticated
using (
  -- Allow if user is the project owner (existing functionality)
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_invitations.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Allow if user's email matches the invitation email
  email = (auth.jwt() ->> 'email')
);

-- Add policy for invited users to update their own invitations (for acceptance)
create policy "project_invitations_update_invited_user"
on "public"."project_invitations"
as permissive
for update
to authenticated
using (
  -- Allow if user is the project owner (existing functionality)
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_invitations.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Allow if user's email matches the invitation email
  email = (auth.jwt() ->> 'email')
)
with check (
  -- Same conditions for the check clause
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_invitations.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  email = (auth.jwt() ->> 'email')
);
