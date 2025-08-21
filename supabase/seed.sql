-- Minimal local seed: 2 users, 2 projects
-- One project has an extra collaborator, the other does not

-- Relax constraints/triggers for bulk seed
SET session_replication_role = replica;

-- Clean current data (public schema only)
-- Clean auth only for our seeded account to avoid sequence ownership issues
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'sandervries@me.com'
) OR (identity_data->>'email') = 'sandervries@me.com';
DELETE FROM auth.users WHERE email = 'sandervries@me.com' OR id = '33333333-3333-3333-3333-333333333333';

-- Clean public tables
TRUNCATE TABLE
  public.file_comments,
  public.file_versions,
  public.project_files,
  public.project_invitations,
  public.project_likes,
  public.project_members,
  public.profile_socials,
  public.projects,
  public.profiles,
  public.todos
RESTART IDENTITY CASCADE;

-- Seed auth: keep local account for Sander
-- bcrypt hash for "password" (cost 10)
-- $2b$10$CwTycUXWue0Thq9StjUM0uJ8J2Z0rt7NmBGG99nmCaTKtyfO3O5Hm
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, last_sign_in_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'sandervries@me.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"sandeeeerr","display_name":"Sander de Vries"}',
  false,
  now(),
  now(),
  now(),
  '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  jsonb_build_object('sub','33333333-3333-3333-3333-333333333333','email','sandervries@me.com'),
  'email',
  'sandervries@me.com',
  now(),
  now(),
  now()
);

-- Seed profiles (2 users)
INSERT INTO public.profiles (id, username, display_name, bio, avatar_url, website, location, social_links, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice', 'Alice', NULL, NULL, NULL, 'Amsterdam', '{}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'bob',   'Bob',   NULL, NULL, NULL, 'Rotterdam', '{}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'sandeeeerr', 'Sander de Vries', 'Producer / DJ from NL', NULL, 'sandervries.me', 'Leeuwarden, NL', '{}'::jsonb, now(), now());

-- Social links for Sander
INSERT INTO public.profile_socials (profile_id, platform, url, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'instagram', 'https://www.instagram.com/sandeeeerr', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'soundcloud', 'https://soundcloud.com/sander-de-vries-917726501', now(), now());

-- Seed projects (2 projects)
-- Project A: owner Alice; has Bob as collaborator
INSERT INTO public.projects (
  id, name, description, tags, genre, owner_id, is_private, downloads_enabled, daw_info, plugins_used, status, created_at, updated_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Collab Track',
  'Project with an extra collaborator',
  '{collab,demo}',
  'House',
  '11111111-1111-1111-1111-111111111111',
  false,
  true,
  '{}'::jsonb,
  '[]'::jsonb,
  'active',
  now(),
  now()
);

-- Project B: owner Bob; solo (no extra members)
INSERT INTO public.projects (
  id, name, description, tags, genre, owner_id, is_private, downloads_enabled, daw_info, plugins_used, status, created_at, updated_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Solo Jam',
  'Project without extra members',
  '{solo,demo}',
  'LoFi',
  '33333333-3333-3333-3333-333333333333',
  false,
  true,
  '{}'::jsonb,
  '[]'::jsonb,
  'active',
  now(),
  now()
);

-- Memberships
-- Owners (optional but explicit)
INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', now(), '11111111-1111-1111-1111-111111111111', now()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'owner', now(), '33333333-3333-3333-3333-333333333333', now());

-- Extra collaborator: Bob on Alice's project
INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'collaborator', now(), '11111111-1111-1111-1111-111111111111', now());

-- Restore constraint behavior
RESET ALL;


