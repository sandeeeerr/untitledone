-- Quick fix: Extend expiration for sandeeeerr invitation to "House plaat"
-- Run this in Supabase SQL Editor

update public.project_invitations
set expires_at = now() + interval '7 days'
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and lower(email) = lower('sandeeeerr@gmail.com')
  and accepted_at is null;

-- Check if it worked
select 
  id,
  email,
  expires_at,
  expires_at > now() as is_valid,
  now() as current_time
from public.project_invitations
where project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and lower(email) = lower('sandeeeerr@gmail.com')
  and accepted_at is null;

-- Debug: Check what the API would see
-- This simulates what the pending invitations API query would return
-- Note: Replace 'sandeeeerr@gmail.com' with the actual email from auth.users if different
select 
  pi.id,
  pi.email as invitation_email,
  pi.expires_at,
  pi.accepted_at,
  pi.expires_at > now() as expires_in_future,
  pi.accepted_at is null as not_accepted,
  p.name as project_name
from public.project_invitations pi
join public.projects p on p.id = pi.project_id
where pi.project_id = '40c3aeed-ac50-4c36-97bd-7108f073b6be'
  and lower(pi.email) = lower('sandeeeerr@gmail.com')
  and pi.accepted_at is null
  and pi.expires_at > now();

