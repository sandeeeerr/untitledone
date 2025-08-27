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
      (gen_random_uuid(), collab_project_id, '11111111-1111-1111-1111-111111111111'::uuid, 'owner', now(), '11111111-1111-1111-1111-111111111111'::uuid, now()),
      (gen_random_uuid(), solo_project_id, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', now(), '33333333-3333-3333-3333-333333333333'::uuid, now());

  -- Extra collaborator: Bob on Alice's project
  INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
      (gen_random_uuid(), collab_project_id, '22222222-2222-2222-2222-222222222222'::uuid, 'collaborator', now(), '11111111-1111-1111-1111-111111111111'::uuid, now());

  -- Create project versions
  INSERT INTO public.project_versions (
    id, project_id, version_type, version_name, description, created_by, is_active, created_at
  ) VALUES 
    (
      gen_random_uuid(),
      collab_project_id,
      'semantic',
      'v3.0',
      'Clean master + minor balance tweaks',
      '22222222-2222-2222-2222-222222222222'::uuid,
      false,
      now() - interval '1 day'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      'semantic',
      'v2.0',
      'Final mix door Julia',
      '22222222-2222-2222-2222-222222222222'::uuid,
      false,
      now() - interval '3 days'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      'semantic',
      'v1.0',
      'Rough sketch door Sam',
      '11111111-1111-1111-1111-111111111111'::uuid,
      false,
      now() - interval '5 days'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      'semantic',
      'v3.0',
      'Final bounce with tape hiss and width',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '1 day'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      'semantic',
      'v2.0',
      'Arrangement polish and subtle saturation',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '3 days'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      'semantic',
      'v1.0',
    'Initial lo-fi jam session',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '5 days'
    );

  -- Ensure latest is active per project (only one active per project)
  UPDATE public.project_versions SET is_active = false WHERE project_id = collab_project_id;
  UPDATE public.project_versions SET is_active = false WHERE project_id = solo_project_id;
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v3.0' AND project_id = collab_project_id;
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v3.0' AND project_id = solo_project_id;

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
      '11111111-1111-1111-1111-111111111111'::uuid,
      '{"description": "Initial demo track with basic structure"}'
    ),
    (
      gen_random_uuid(), 
      collab_project_id, 
      'collab_track_v2.wav', 
      '/uploads/' || collab_project_id || '/collab_track_v2.wav',
      62914560, -- 60MB
      'audio/wav',
      '22222222-2222-2222-2222-222222222222'::uuid,
      '{"description": "Added bassline and improved drums"}'
    ),
    (
      gen_random_uuid(), 
      solo_project_id, 
      'solo_jam_v1.flp', 
      '/uploads/' || solo_project_id || '/solo_jam_v1.flp',
      1048576, -- 1MB
      'application/x-flp',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "FL Studio project file for lo-fi jam"}'
    ),
    (
      gen_random_uuid(), 
      solo_project_id, 
      'solo_jam_v1_export.mp3', 
      '/uploads/' || solo_project_id || '/solo_jam_v1_export.mp3',
      8388608, -- 8MB
      'audio/mpeg',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Exported MP3 from FL Studio session"}'
    ),
    (
      gen_random_uuid(), 
      collab_project_id, 
      'collab_track_v3.wav', 
      '/uploads/' || collab_project_id || '/collab_track_v3.wav',
      68157440, -- 65MB
      'audio/wav',
      '22222222-2222-2222-2222-222222222222'::uuid,
      '{"description": "Finalized master bounce"}'
    ),
    (
      gen_random_uuid(), 
      solo_project_id, 
      'solo_jam_v2.flp', 
      '/uploads/' || solo_project_id || '/solo_jam_v2.flp',
      1468006, -- 1.4MB
      'application/x-flp',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Second iteration project file"}'
    ),
    (
      gen_random_uuid(), 
      solo_project_id, 
      'solo_jam_v3.mp3', 
      '/uploads/' || solo_project_id || '/solo_jam_v3.mp3',
      9437184, -- 9MB
      'audio/mpeg',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Final master export"}'
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
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v3.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v3.mp3')
    );

  -- Create activity changes (microChanges)
  INSERT INTO public.activity_changes (
    id, version_id, type, description, author_id, file_id
  ) VALUES 
    -- Collab v1.0 changes (5 items)
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'addition',
      'Bassline toegevoegd',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'feedback',
      'Kick is te droog',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'addition',
      'Vocal take toegevoegd',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'update',
      'Drum pattern aangepast',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      'feedback',
      'Chord progression voelt te simpel',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav')
    ),
    -- Collab v2.0 changes (5 items)
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'addition',
      'Reverb toegevoegd op vocals',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'feedback',
      'Bass levels zijn perfect nu',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'update',
      'Master limiter aangepast',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'addition',
      'Subtle delay op lead synth',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      'feedback',
      'Drums klinken nu veel warmer',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav')
    ),
    -- Collab v3.0 changes (5 items)
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      'update',
      'Stereo image iets verbreed',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v3.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      'addition',
      'Vocal de-esser toegevoegd',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v3.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      'feedback',
      'Mid-range klinkt nu cleaner',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v3.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      'update',
      'Transients iets zachter in de master',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v3.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      'addition',
      'Final compression layer toegevoegd',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v3.wav')
    ),
    -- Solo v1.0 changes (4 items)
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      'addition',
      'Basic lo-fi drum pattern',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      'addition',
      'Warm pad synth layer',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      'feedback',
      'This lo-fi vibe is exactly what I was going for. Might add some vinyl crackle later.',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      'update',
      'Sidechain compression toegevoegd',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v1.flp')
    ),
    -- Solo v2.0 changes (5 items)
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      'addition',
      'Subtle vinyl crackle layer toegevoegd',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      'update',
      'Sidechain fine-tuned',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      'update',
      'Sidechain fine-tuned',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      'addition',
      'Analog saturation plugin toegevoegd',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      'feedback',
      'Arrangement voelt nu compleet',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      'update',
      'EQ balance aangepast voor warmte',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v2.flp')
    ),
    -- Solo v3.0 changes (5 items)
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      'update',
      'Tape hiss en stereo width aangepast',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v3.mp3')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      'feedback',
      'Eindresultaat voelt warm en breed',
      '11111111-1111-1111-1111-111111111111'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v3.mp3')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      'addition',
      'Final mastering chain toegevoegd',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v3.mp3')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      'update',
      'Loudness target naar -14 LUFS',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v3.mp3')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      'feedback',
      'Perfect voor vinyl release',
      '22222222-2222-2222-2222-222222222222'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'solo_jam_v3.mp3')
    );

  -- Add some project comments for testing
  INSERT INTO public.project_comments (
    id, project_id, version_id, user_id, comment
  ) VALUES 
    -- Collab v1.0 comments (4 items)
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Great start! Love the chord progression. Maybe we could add some percussion?'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Kick heeft meer punch nodig, maar de groove is goed!'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Vocal take klinkt natuurlijk. Misschien wat meer reverb?'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = collab_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Drum pattern is nu veel interessanter!'
    ),
    -- Collab v2.0 comments (5 items)
          (
        gen_random_uuid(),
        collab_project_id,
        (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Bass sounds perfect! The drums are much better now.'
      ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Reverb op vocals voegt veel diepte toe!'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Delay op lead synth is subtiel maar effectief'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Master limiter settings zijn perfect'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = collab_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Drums klinken nu veel warmer inderdaad!'
    ),
    -- Collab v3.0 comments (5 items)
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Stereo image is nu perfect breed!'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Vocal de-esser maakt het veel cleaner'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Mid-range balance is nu spot-on'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Transients zijn nu perfect punchy'
    ),
    (
      gen_random_uuid(),
      collab_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = collab_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Final compression voegt veel body toe!'
    ),
    -- Solo v1.0 comments (3 items)
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Basic lo-fi drums zijn perfect voor deze vibe'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Warm pad synth voegt veel atmosfeer toe'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = solo_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Sidechain compression maakt het dynamisch'
    ),
    -- Solo v2.0 comments (4 items)
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Vinyl crackle voegt authenticiteit toe!'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Sidechain is nu perfect getimed'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Analog saturation maakt het warmer'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = solo_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'EQ balance is nu perfect voor warmte'
    ),
    -- Solo v3.0 comments (4 items)
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      'Tape hiss voegt vintage karakter toe!'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      '22222222-2222-2222-2222-222222222222'::uuid,
      'Stereo width is perfect breed'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Mastering chain is professioneel'
    ),
    (
      gen_random_uuid(),
      solo_project_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = solo_project_id),
      '11111111-1111-1111-1111-111111111111'::uuid,
      '-14 LUFS is perfect voor streaming!'
    );

  -- Link a few comments to activity changes and files (with audio timecodes) and replies
  -- Head comment on a change (Collab v1 feedback on collab_track_v1.wav)
  WITH ac AS (
    SELECT id FROM public.activity_changes 
    WHERE description = 'Kick is te droog' LIMIT 1
  ), f AS (
    SELECT id FROM public.project_files WHERE filename = 'collab_track_v1.wav' LIMIT 1
  )
  INSERT INTO public.project_comments (id, project_id, activity_change_id, file_id, user_id, comment, timestamp_ms)
  SELECT gen_random_uuid(), collab_project_id, ac.id, f.id, '11111111-1111-1111-1111-111111111111'::uuid,
         'Luister hier rond 00:42s, kick mag iets vetter', 42000
  FROM ac, f;

  -- Another head comment on v2 update with replies
  WITH target AS (
    SELECT 
      (SELECT id FROM public.activity_changes WHERE description = 'Master limiter aangepast' LIMIT 1) AS change_id,
      (SELECT id FROM public.project_files WHERE filename = 'collab_track_v2.wav' LIMIT 1) AS file_id
  ), head AS (
    INSERT INTO public.project_comments (id, project_id, activity_change_id, file_id, user_id, comment)
    SELECT gen_random_uuid(), collab_project_id, target.change_id, target.file_id, '22222222-2222-2222-2222-222222222222'::uuid, 'Limiter settings klinken beter zo'
    FROM target
    RETURNING id
  )
  INSERT INTO public.project_comments (id, project_id, parent_id, user_id, comment)
  SELECT * FROM (
    SELECT gen_random_uuid() AS id, collab_project_id AS project_id, (SELECT id FROM head) AS parent_id, '11111111-1111-1111-1111-111111111111'::uuid AS user_id, 'Kunnen we attack nog iets verlagen?' AS comment
    UNION ALL
    SELECT gen_random_uuid(), collab_project_id, (SELECT id FROM head), '33333333-3333-3333-3333-333333333333'::uuid, 'Mee eens, mids komen beter door'
  ) s;

END $$;

-- Restore constraint behavior
RESET ALL;


