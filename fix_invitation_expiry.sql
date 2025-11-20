-- Fix expired invitation for sandeeeerr@gmail.com to "House plaat" project
-- This will make the invitation visible again in the invitations screen

-- First, check current invitations for this email/project
select 
  id,
  project_id,
  email,
  role,
  expires_at,
  accepted_at,
  created_at,
  case 
    when expires_at < now() then 'EXPIRED'
    when accepted_at is not null then 'ACCEPTED'
    else 'ACTIVE'
  end as status
from public.project_invitations
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and email = 'sandeeeerr@gmail.com'
order by created_at desc;

-- Update ALL expired invitations for this email/project to extend expiration (7 days from now)
-- This ensures we catch the right one even if there are multiple
update public.project_invitations
set expires_at = now() + interval '7 days'
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and lower(email) = lower('sandeeeerr@gmail.com')
  and accepted_at is null;

-- Verify the update worked
select 
  id,
  project_id,
  email,
  role,
  expires_at,
  accepted_at,
  created_at,
  expires_at > now() as is_valid,
  now() as current_time
from public.project_invitations
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and email = 'sandeeeerr@gmail.com'
  and accepted_at is null
order by created_at desc;

-- Debug: Check what email the user has in auth.users
-- (This helps verify if email matching is the issue)
-- Note: You may need to run this as a superuser or check manually
-- select email from auth.users where id = 'e13125e4-04b7-4000-bcfd-44dbb2431e18';

