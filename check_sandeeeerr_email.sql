-- Check which email belongs to sandeeeerr user
-- User ID: e13125e4-04b7-4000-bcfd-44dbb2431e18

-- Check profile info
select 
  id,
  username,
  display_name,
  email as profile_email -- This might be null, profiles don't store email
from public.profiles
where id = 'e13125e4-04b7-4000-bcfd-44dbb2431e18'
  or username = 'sandeeeerr';

-- Check invitations sent TO sandeeeerr (shows what email was used)
select 
  id,
  email as invitation_email,
  project_id,
  role,
  expires_at,
  accepted_at,
  created_at
from public.project_invitations
where email ilike '%sandeeeerr%'
order by created_at desc;

-- Check auth.users email (requires superuser or service role)
-- Note: This might not work in regular SQL editor, but try it
-- If it doesn't work, check in Supabase Dashboard > Authentication > Users
select 
  id,
  email,
  email_confirmed_at,
  created_at
from auth.users
where id = 'e13125e4-04b7-4000-bcfd-44dbb2431e18';

-- Alternative: Check all invitations to see what emails are being used
select distinct
  email,
  count(*) as invitation_count
from public.project_invitations
where email ilike '%sand%'
group by email
order by invitation_count desc;

