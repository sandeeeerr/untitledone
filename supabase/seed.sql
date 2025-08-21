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
  public.project_comments,
  public.activity_changes,
  public.version_files,
  public.project_versions,
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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

-- Store the generated project IDs for later use
DO $$
DECLARE
  collab_project_id uuid;
  solo_project_id uuid;
BEGIN
  -- Get the project IDs we just created
  SELECT id INTO collab_project_id FROM public.projects WHERE name = 'Collab Track' LIMIT 1;
  SELECT id INTO solo_project_id FROM public.projects WHERE name = 'Solo Jam' LIMIT 1;

-- Memberships
-- Owners (optional but explicit)
INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
    (gen_random_uuid(), collab_project_id, '11111111-1111-1111-1111-111111111111', 'owner', now(), '11111111-1111-1111-1111-111111111111', now()),
    (gen_random_uuid(), solo_project_id, '33333333-3333-3333-3333-333333333333', 'owner', now(), '33333333-3333-3333-3333-333333333333', now());

-- Extra collaborator: Bob on Alice's project
INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
    (gen_random_uuid(), collab_project_id, '22222222-2222-2222-2222-222222222222', 'collaborator', now(), '11111111-1111-1111-1111-111111111111', now());

  -- Create project versions
  INSERT INTO public.project_versions (
    id, project_id, version_type, version_name, description, created_by, is_active
  ) VALUES 
    (
      gen_random_uuid(),
      collab_project_id,
      'semantic',
      'v1.0',
      'Rough sketch door Sam',
      '11111111-1111-1111-1111-111111111111',
      false
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      'semantic',
      'v2.0',
      'Final mix door Julia',
      '22222222-2222-2222-2222-222222222222',
      true
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      'semantic',
      'v1.0',
      'Initial lo-fi jam session',
      '33333333-3333-3333-3333-333333333333',
      true
    );

  -- Add some sample project files for testing
  INSERT INTO public.project_files (
    id, project_id, filename, file_path, file_size, file_type, 
    uploaded_by, metadata
  ) VALUES 
    (
      gen_random_uuid(), 
      collab_project_id, 
      'collab_track_v1.wav', 
      '/uploads/' || collab_project_id || '/collab_track_v1.wav',
      52428800, -- 50MB
      'audio/wav',
      '11111111-1111-1111-1111-111111111111',
      '{"description": "Initial demo track with basic structure"}'
    ),
    (
      gen_random_uuid(), 
      collab_project_id, 
      'collab_track_v2.wav', 
      '/uploads/' || collab_project_id || '/collab_track_v2.wav',
      62914560, -- 60MB
      'audio/wav',
      '22222222-2222-2222-2222-222222222222',
      '{"description": "Added bassline and improved drums"}'
    ),
    (
      gen_random_uuid(), 
      solo_project_id, 
      'solo_jam_v1.flp', 
      '/uploads/' || solo_project_id || '/solo_jam_v1.flp',
      1048576, -- 1MB
      'application/x-flp',
      '33333333-3333-3333-3333-333333333333',
      '{"description": "FL Studio project file for lo-fi jam"}'
    ),
    (
      gen_random_uuid(), 
      solo_project_id, 
      'solo_jam_v1_export.mp3', 
      '/uploads/' || solo_project_id || '/solo_jam_v1_export.mp3',
      8388608, -- 8MB
      'audio/mpeg',
      '33333333-3333-3333-3333-333333333333',
      '{"description": "Exported MP3 from FL Studio session"}'
    );

  -- Link files to versions
  INSERT INTO public.version_files (
    id, version_id, file_id
  ) VALUES 
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1_export.mp3')
    );

  -- Create activity changes (microChanges)
  INSERT INTO public.activity_changes (
    id, version_id, type, description, author_id, file_id
  ) VALUES 
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'addition',
      'Bassline toegevoegd',
      '22222222-2222-2222-2222-222222222222',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'feedback',
      'Kick is te droog',
      '11111111-1111-1111-1111-111111111111',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'addition',
      'Vocal take toegevoegd',
      '22222222-2222-2222-2222-222222222222',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'update',
      'Drum pattern aangepast',
      '11111111-1111-1111-1111-111111111111',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'addition',
      'Reverb toegevoegd op vocals',
      '22222222-2222-2222-2222-222222222222',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'feedback',
      'Bass levels zijn perfect nu',
      '11111111-1111-1111-1111-111111111111',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'update',
      'Master limiter aangepast',
      '22222222-2222-2222-2222-222222222222',
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      'feedback',
      'This lo-fi vibe is exactly what I was going for. Might add some vinyl crackle later.',
      '33333333-3333-3333-3333-333333333333',
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1.flp')
    );

  -- Add some project comments for testing
  INSERT INTO public.project_comments (
    id, project_id, version_id, user_id, comment
  ) VALUES 
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      '22222222-2222-2222-2222-222222222222',
      'Great start! Love the chord progression. Maybe we could add some percussion?'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      '11111111-1111-1111-1111-111111111111',
      'Bass sounds perfect! The drums are much better now.'
    );

END $$;

-- Restore constraint behavior
RESET ALL;


