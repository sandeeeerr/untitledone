-- Quick demo fix: Add sandeeeerr directly as collaborator to "House plaat" project
-- This bypasses the invitation flow for demo purposes

-- Project: House plaat (40c3aeed-ac50-4c36-97bd-7108f073b6be)
-- User to add: sandeeeerr (e13125e4-04b7-4000-bcfd-44dbb2431e18)
-- Added by: sander (7bd2697d-8e7b-482a-bdff-60aacfd9fbff) - project owner

insert into public.project_members (project_id, user_id, role, added_by)
values (
  '40c3aeed-ac50-4c36-97bd-7108f073b6be',
  'e13125e4-04b7-4000-bcfd-44dbb2431e18',
  'collaborator',
  '7bd2697d-8e7b-482a-bdff-60aacfd9fbff'
)
on conflict (project_id, user_id) do update 
set role = excluded.role;

-- Verify the member was added
select 
  pm.id,
  pm.project_id,
  p.name as project_name,
  pm.user_id,
  prof.username,
  prof.display_name,
  pm.role,
  pm.joined_at
from public.project_members pm
join public.projects p on p.id = pm.project_id
join public.profiles prof on prof.id = pm.user_id
where pm.project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and pm.user_id = 'e13125e4-04b7-4000-bcfd-44dbb2431e18';

