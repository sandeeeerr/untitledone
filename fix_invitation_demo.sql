-- Fix expired invitation for demo purposes
-- Extends the expiration date of the existing invitation for sandeeeerr@gmail.com
-- to project "House plaat" (40c3aeed-ac50-4c36-97bd-7108f073b6be)
-- 
-- User: sandeeeerr (e13125e4-04b7-4000-bcfd-44dbb2431e18)
-- Project: House plaat (40c3aeed-ac50-4c36-97bd-7108f073b6be)
-- Owner: sander (7bd2697d-8e7b-482a-bdff-60aacfd9fbff)

-- Option 1: Update existing invitation to extend expiration
update public.project_invitations
set expires_at = now() + interval '7 days'
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and email = 'sandeeeerr@gmail.com'
  and accepted_at is null;

-- Option 2: Directly add as project member (faster for demo)
-- Uncomment below if you want to skip invitation flow entirely
/*
insert into public.project_members (project_id, user_id, role, added_by)
values (
  '40c3aeed-ac50-4c36-97bd-7108f073b6be',
  'e13125e4-04b7-4000-bcfd-44dbb2431e18',
  'collaborator',
  '7bd2697d-8e7b-482a-bdff-60aacfd9fbff'
)
on conflict (project_id, user_id) do update 
set role = excluded.role;
*/

-- Verify invitations
select 
  id,
  project_id,
  email,
  role,
  expires_at,
  accepted_at,
  created_at
from public.project_invitations
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and email = 'sandeeeerr@gmail.com'
order by created_at desc;

-- Verify project members
select 
  pm.id,
  pm.project_id,
  pm.user_id,
  p.username,
  pm.role,
  pm.joined_at
from public.project_members pm
join public.profiles p on p.id = pm.user_id
where pm.project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
order by pm.joined_at desc;

