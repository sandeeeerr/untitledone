-- Migration: Add function to find user by email
-- Purpose: Allow looking up users by email address for invitations
-- This is needed because we can't directly query auth.users from the API

begin;

-- Create a function to find user ID by email
-- This function can be called from the API to check if a user exists
create or replace function public.find_user_by_email(user_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
begin
  -- Query auth.users to find the user by email
  select id into user_id
  from auth.users
  where email = user_email;
  
  return user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.find_user_by_email(text) to authenticated;

commit;
