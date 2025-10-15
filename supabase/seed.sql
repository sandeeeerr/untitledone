-- Comprehensive local seed: 3 users, 5 projects
-- Multiple projects for Sander with realistic collaboration scenarios

-- Relax constraints/triggers for bulk seed
SET session_replication_role = replica;

-- Clean current data (public schema only)
-- Clean auth for our seeded accounts to avoid sequence ownership issues
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('sandervries@me.com', 'alice.johnson@example.com', 'bob.williams@example.com')
) OR (identity_data->>'email') IN ('sandervries@me.com', 'alice.johnson@example.com', 'bob.williams@example.com');
DELETE FROM auth.users WHERE email IN ('sandervries@me.com', 'alice.johnson@example.com', 'bob.williams@example.com') 
  OR id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555');

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

-- Seed auth users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, last_sign_in_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES 
  -- Sander (main user with multiple projects)
  (
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
  ),
  -- Alice (collaborator)
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alice.johnson@example.com',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"alice_j","display_name":"Alice Johnson"}',
    false,
    now(),
    now(),
    now(),
    '', '', '', ''
  ),
  -- Bob (occasional collaborator)
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bob.williams@example.com',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"bob_w","display_name":"Bob Williams"}',
    false,
    now(),
    now(),
    now(),
    '', '', '', ''
  );

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES 
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    jsonb_build_object('sub','33333333-3333-3333-3333-333333333333','email','sandervries@me.com'),
    'email',
    'sandervries@me.com',
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    jsonb_build_object('sub','44444444-4444-4444-4444-444444444444','email','alice.johnson@example.com'),
    'email',
    'alice.johnson@example.com',
    now(),
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    jsonb_build_object('sub','55555555-5555-5555-5555-555555555555','email','bob.williams@example.com'),
    'email',
    'bob.williams@example.com',
    now(),
    now(),
    now()
  );

-- Seed profiles (3 users)
INSERT INTO public.profiles (id, username, display_name, bio, avatar_url, website, location, social_links, created_at, updated_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'sandeeeerr', 'Sander de Vries', 'Electronic music producer and DJ from the Netherlands. Specializing in ambient, techno, and experimental sounds.', NULL, 'sandervries.me', 'Leeuwarden, Netherlands', '{}'::jsonb, now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'alice_j', 'Alice Johnson', 'Vocalist and songwriter with a passion for electronic and indie music. Based in Amsterdam.', NULL, 'alicejohnsonmusic.com', 'Amsterdam, Netherlands', '{}'::jsonb, now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'bob_w', 'Bob Williams', 'Mixing and mastering engineer with 10+ years experience in electronic music production.', NULL, 'bobwilliamsaudio.com', 'Rotterdam, Netherlands', '{}'::jsonb, now(), now());

-- Social links for all users
INSERT INTO public.profile_socials (profile_id, platform, url, created_at, updated_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'instagram', 'https://www.instagram.com/sandeeeerr', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'soundcloud', 'https://soundcloud.com/sander-de-vries-917726501', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'spotify', 'https://open.spotify.com/artist/sandervries', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'instagram', 'https://www.instagram.com/alicejohnsonmusic', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'youtube', 'https://youtube.com/alicejohnsonmusic', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'bandcamp', 'https://bobwilliamsaudio.bandcamp.com', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'soundcloud', 'https://soundcloud.com/bobwilliamsaudio', now(), now());

-- Seed projects (5 projects for Sander)
INSERT INTO public.projects (
  id, name, description, tags, genre, owner_id, is_private, downloads_enabled, daw_info, plugins_used, status, created_at, updated_at
) VALUES 
  -- Project 1: Ambient Techno Track
  (
    gen_random_uuid(),
    'Midnight Reverie',
    'An atmospheric techno track exploring the intersection of ambient textures and driving rhythms. Built around a haunting pad progression and evolving percussive elements.',
    '{ambient,techno,atmospheric,experimental}',
    'Techno',
    '33333333-3333-3333-3333-333333333333',
    false,
    true,
    '{"daw": "Ableton Live 12", "bpm": 128, "key": "Dm"}',
    '["Serum", "Valhalla Room", "FabFilter Pro-Q 3", "Soundtoys EchoBoy"]',
    'active',
    now() - interval '15 days',
    now() - interval '2 days'
  ),
  -- Project 2: Collaboration with Alice
  (
    gen_random_uuid(),
    'Electric Dreams',
    'A collaborative electronic pop track featuring Alice''s ethereal vocals over a bed of analog synthesizers and modern production techniques.',
    '{electronic,pop,collaboration,vocals,synthwave}',
    'Electronic Pop',
    '33333333-3333-3333-3333-333333333333',
    false,
    true,
    '{"daw": "Logic Pro X", "bpm": 110, "key": "Am"}',
    '["Omnisphere", "VocalSynth 2", "Waves CLA-2A", "Arturia V Collection"]',
    'active',
    now() - interval '8 days',
    now() - interval '1 day'
  ),
  -- Project 3: Experimental Ambient
  (
    gen_random_uuid(),
    'Digital Forest',
    'An experimental ambient piece created entirely with modular synthesis and field recordings. Explores the concept of nature through digital means.',
    '{ambient,experimental,modular,field-recordings,atmospheric}',
    'Ambient',
    '33333333-3333-3333-3333-333333333333',
    false,
    true,
    '{"daw": "Bitwig Studio", "bpm": 60, "key": "Free"}',
    '["VCV Rack", "Reaktor 6", "Izotope RX", "Native Instruments Kontakt"]',
    'active',
    now() - interval '22 days',
    now() - interval '5 days'
  ),
  -- Project 4: Another collaboration with Alice
  (
    gen_random_uuid(),
    'Neon Nights',
    'A synthwave-inspired track featuring Alice''s haunting vocals and retro-futuristic production. Perfect for late-night drives through the city.',
    '{synthwave,retrowave,vocals,nostalgic,electronic}',
    'Synthwave',
    '33333333-3333-3333-3333-333333333333',
    false,
    true,
    '{"daw": "FL Studio 21", "bpm": 95, "key": "Cm"}',
    '["Arturia Jupiter-8V", "TAL-U-NO-LX", "Valhalla VintageVerb", "Waves L2"]',
    'active',
    now() - interval '12 days',
    now() - interval '3 days'
  ),
  -- Project 5: Solo Deep House
  (
    gen_random_uuid(),
    'Underground Movement',
    'A deep house track with organic elements and driving basslines. Focuses on groove and musicality over technical complexity.',
    '{deep-house,organic,groove,underground,minimal}',
    'Deep House',
    '33333333-3333-3333-3333-333333333333',
    false,
    true,
    '{"daw": "Ableton Live 12", "bpm": 124, "key": "Fm"}',
    '["Massive X", "FabFilter Saturn", "Waves SSL E-Channel", "Output Movement"]',
    'active',
    now() - interval '6 days',
    now() - interval '1 day'
  );

-- Store the generated project IDs for later use
DO $$
DECLARE
  midnight_reverie_id uuid;
  electric_dreams_id uuid;
  digital_forest_id uuid;
  neon_nights_id uuid;
  underground_movement_id uuid;
BEGIN
  -- Get the project IDs we just created
  SELECT id INTO midnight_reverie_id FROM public.projects WHERE name = 'Midnight Reverie' LIMIT 1;
  SELECT id INTO electric_dreams_id FROM public.projects WHERE name = 'Electric Dreams' LIMIT 1;
  SELECT id INTO digital_forest_id FROM public.projects WHERE name = 'Digital Forest' LIMIT 1;
  SELECT id INTO neon_nights_id FROM public.projects WHERE name = 'Neon Nights' LIMIT 1;
  SELECT id INTO underground_movement_id FROM public.projects WHERE name = 'Underground Movement' LIMIT 1;

  -- Memberships
  -- All projects are owned by Sander
  INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
      (gen_random_uuid(), midnight_reverie_id, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', now(), '33333333-3333-3333-3333-333333333333'::uuid, now()),
      (gen_random_uuid(), electric_dreams_id, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', now(), '33333333-3333-3333-3333-333333333333'::uuid, now()),
      (gen_random_uuid(), digital_forest_id, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', now(), '33333333-3333-3333-3333-333333333333'::uuid, now()),
      (gen_random_uuid(), neon_nights_id, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', now(), '33333333-3333-3333-3333-333333333333'::uuid, now()),
      (gen_random_uuid(), underground_movement_id, '33333333-3333-3333-3333-333333333333'::uuid, 'owner', now(), '33333333-3333-3333-3333-333333333333'::uuid, now());

  -- Collaborators: Alice on Electric Dreams and Neon Nights
  INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
      (gen_random_uuid(), electric_dreams_id, '44444444-4444-4444-4444-444444444444'::uuid, 'collaborator', now() - interval '7 days', '33333333-3333-3333-3333-333333333333'::uuid, now() - interval '7 days'),
      (gen_random_uuid(), neon_nights_id, '44444444-4444-4444-4444-444444444444'::uuid, 'collaborator', now() - interval '11 days', '33333333-3333-3333-3333-333333333333'::uuid, now() - interval '11 days');

  -- Bob occasionally collaborates on mixing/mastering
  INSERT INTO public.project_members (id, project_id, user_id, role, joined_at, added_by, created_at) VALUES
      (gen_random_uuid(), midnight_reverie_id, '55555555-5555-5555-5555-555555555555'::uuid, 'collaborator', now() - interval '5 days', '33333333-3333-3333-3333-333333333333'::uuid, now() - interval '5 days');

  -- Create project versions for all projects
  INSERT INTO public.project_versions (
    id, project_id, version_type, version_name, description, created_by, is_active, created_at
  ) VALUES 
    -- Midnight Reverie versions
    (
      gen_random_uuid(),
      midnight_reverie_id,
      'semantic',
      'v3.0',
      'Final master with enhanced stereo imaging and subtle tape saturation',
      '55555555-5555-5555-5555-555555555555'::uuid,
      false,
      now() - interval '1 day'
    ),
    (
      gen_random_uuid(),
      midnight_reverie_id,
      'semantic',
      'v2.0',
      'Added atmospheric reverb and refined percussion patterns',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '4 days'
    ),
    (
      gen_random_uuid(),
      midnight_reverie_id,
      'semantic',
      'v1.0',
      'Initial ambient techno foundation with basic arrangement',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '10 days'
    ),
    -- Electric Dreams versions
    (
      gen_random_uuid(),
      electric_dreams_id,
      'semantic',
      'v4.0',
      'Final mix with Alice''s vocals fully integrated and polished',
      '44444444-4444-4444-4444-444444444444'::uuid,
      false,
      now() - interval '1 day'
    ),
    (
      gen_random_uuid(),
      electric_dreams_id,
      'semantic',
      'v3.0',
      'Vocal recording session completed, basic mixing applied',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '3 days'
    ),
    (
      gen_random_uuid(),
      electric_dreams_id,
      'semantic',
      'v2.0',
      'Instrumental track completed, ready for vocals',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '5 days'
    ),
    (
      gen_random_uuid(),
      electric_dreams_id,
      'semantic',
      'v1.0',
      'Initial synthwave foundation with chord progression',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '7 days'
    ),
    -- Digital Forest versions
    (
      gen_random_uuid(),
      digital_forest_id,
      'semantic',
      'v2.0',
      'Enhanced modular textures with field recording integration',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '3 days'
    ),
    (
      gen_random_uuid(),
      digital_forest_id,
      'semantic',
      'v1.0',
      'Initial experimental ambient exploration with modular synthesis',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '15 days'
    ),
    -- Neon Nights versions
    (
      gen_random_uuid(),
      neon_nights_id,
      'semantic',
      'v3.0',
      'Final synthwave mix with Alice''s haunting vocals and retro effects',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '2 days'
    ),
    (
      gen_random_uuid(),
      neon_nights_id,
      'semantic',
      'v2.0',
      'Added Alice''s vocal takes and basic retro processing',
      '44444444-4444-4444-4444-444444444444'::uuid,
      false,
      now() - interval '5 days'
    ),
    (
      gen_random_uuid(),
      neon_nights_id,
      'semantic',
      'v1.0',
      'Initial synthwave instrumental with vintage analog sounds',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '10 days'
    ),
    -- Underground Movement versions
    (
      gen_random_uuid(),
      underground_movement_id,
      'semantic',
      'v2.0',
      'Enhanced groove with improved bassline and organic percussion',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '2 days'
    ),
    (
      gen_random_uuid(),
      underground_movement_id,
      'semantic',
      'v1.0',
      'Initial deep house foundation with basic groove elements',
      '33333333-3333-3333-3333-333333333333'::uuid,
      false,
      now() - interval '5 days'
    );

  -- Ensure latest is active per project (only one active per project)
  UPDATE public.project_versions SET is_active = false WHERE project_id = midnight_reverie_id;
  UPDATE public.project_versions SET is_active = false WHERE project_id = electric_dreams_id;
  UPDATE public.project_versions SET is_active = false WHERE project_id = digital_forest_id;
  UPDATE public.project_versions SET is_active = false WHERE project_id = neon_nights_id;
  UPDATE public.project_versions SET is_active = false WHERE project_id = underground_movement_id;
  
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v3.0' AND project_id = midnight_reverie_id;
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v4.0' AND project_id = electric_dreams_id;
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v2.0' AND project_id = digital_forest_id;
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v3.0' AND project_id = neon_nights_id;
  UPDATE public.project_versions SET is_active = true WHERE version_name = 'v2.0' AND project_id = underground_movement_id;

  -- Add realistic project files for all projects
  INSERT INTO public.project_files (
    id, project_id, filename, file_path, file_size, file_type, 
    uploaded_by, metadata
  ) VALUES 
    -- Midnight Reverie files
    (
      gen_random_uuid(), 
      midnight_reverie_id, 
      'midnight_reverie_v1.als', 
      '/uploads/' || midnight_reverie_id || '/midnight_reverie_v1.als',
      15728640, -- 15MB
      'application/x-ableton-live-set',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Initial Ableton Live project with ambient techno foundation", "bpm": 128, "key": "Dm"}'
    ),
    (
      gen_random_uuid(), 
      midnight_reverie_id, 
      'midnight_reverie_v2.wav', 
      '/uploads/' || midnight_reverie_id || '/midnight_reverie_v2.wav',
      94371840, -- 90MB
      'audio/wav',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Enhanced version with atmospheric reverb and refined percussion", "bit_depth": 24, "sample_rate": 48000}'
    ),
    (
      gen_random_uuid(), 
      midnight_reverie_id, 
      'midnight_reverie_v3_master.wav', 
      '/uploads/' || midnight_reverie_id || '/midnight_reverie_v3_master.wav',
      104857600, -- 100MB
      'audio/wav',
      '55555555-5555-5555-5555-555555555555'::uuid,
      '{"description": "Final master with enhanced stereo imaging and tape saturation", "bit_depth": 24, "sample_rate": 48000}'
    ),
    -- Electric Dreams files
    (
      gen_random_uuid(), 
      electric_dreams_id, 
      'electric_dreams_v1.logicx', 
      '/uploads/' || electric_dreams_id || '/electric_dreams_v1.logicx',
      20971520, -- 20MB
      'application/x-logic-pro-x',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Initial Logic Pro X project with synthwave foundation", "bpm": 110, "key": "Am"}'
    ),
    (
      gen_random_uuid(), 
      electric_dreams_id, 
      'electric_dreams_v2_instrumental.wav', 
      '/uploads/' || electric_dreams_id || '/electric_dreams_v2_instrumental.wav',
      73400320, -- 70MB
      'audio/wav',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Instrumental version ready for vocal recording", "bit_depth": 24, "sample_rate": 48000}'
    ),
    (
      gen_random_uuid(), 
      electric_dreams_id, 
      'electric_dreams_vocal_takes.zip', 
      '/uploads/' || electric_dreams_id || '/electric_dreams_vocal_takes.zip',
      25165824, -- 24MB
      'application/zip',
      '44444444-4444-4444-4444-444444444444'::uuid,
      '{"description": "Alice''s vocal recording session files", "takes": 8, "format": "WAV"}'
    ),
    (
      gen_random_uuid(), 
      electric_dreams_id, 
      'electric_dreams_v4_final.wav', 
      '/uploads/' || electric_dreams_id || '/electric_dreams_v4_final.wav',
      83886080, -- 80MB
      'audio/wav',
      '44444444-4444-4444-4444-444444444444'::uuid,
      '{"description": "Final mix with Alice''s vocals fully integrated", "bit_depth": 24, "sample_rate": 48000}'
    ),
    -- Digital Forest files
    (
      gen_random_uuid(), 
      digital_forest_id, 
      'digital_forest_v1.bitwig', 
      '/uploads/' || digital_forest_id || '/digital_forest_v1.bitwig',
      31457280, -- 30MB
      'application/x-bitwig-project',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Initial Bitwig Studio project with modular synthesis", "bpm": 60, "key": "Free"}'
    ),
    (
      gen_random_uuid(), 
      digital_forest_id, 
      'field_recordings.zip', 
      '/uploads/' || digital_forest_id || '/field_recordings.zip',
      52428800, -- 50MB
      'application/zip',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Field recordings from forest locations for texture", "recordings": 12, "duration": "45 minutes"}'
    ),
    (
      gen_random_uuid(), 
      digital_forest_id, 
      'digital_forest_v2.wav', 
      '/uploads/' || digital_forest_id || '/digital_forest_v2.wav',
      125829120, -- 120MB
      'audio/wav',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Enhanced ambient piece with field recording integration", "bit_depth": 24, "sample_rate": 48000}'
    ),
    -- Neon Nights files
    (
      gen_random_uuid(), 
      neon_nights_id, 
      'neon_nights_v1.flp', 
      '/uploads/' || neon_nights_id || '/neon_nights_v1.flp',
      12582912, -- 12MB
      'application/x-flp',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Initial FL Studio project with vintage analog sounds", "bpm": 95, "key": "Cm"}'
    ),
    (
      gen_random_uuid(), 
      neon_nights_id, 
      'alice_vocal_demo.wav', 
      '/uploads/' || neon_nights_id || '/alice_vocal_demo.wav',
      25165824, -- 24MB
      'audio/wav',
      '44444444-4444-4444-4444-444444444444'::uuid,
      '{"description": "Alice''s initial vocal demo for synthwave track", "bit_depth": 24, "sample_rate": 48000}'
    ),
    (
      gen_random_uuid(), 
      neon_nights_id, 
      'neon_nights_v3_final.wav', 
      '/uploads/' || neon_nights_id || '/neon_nights_v3_final.wav',
      62914560, -- 60MB
      'audio/wav',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Final synthwave mix with Alice''s vocals and retro effects", "bit_depth": 24, "sample_rate": 48000}'
    ),
    -- Underground Movement files
    (
      gen_random_uuid(), 
      underground_movement_id, 
      'underground_movement_v1.als', 
      '/uploads/' || underground_movement_id || '/underground_movement_v1.als',
      10485760, -- 10MB
      'application/x-ableton-live-set',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Initial deep house project with basic groove", "bpm": 124, "key": "Fm"}'
    ),
    (
      gen_random_uuid(), 
      underground_movement_id, 
      'underground_movement_v2.wav', 
      '/uploads/' || underground_movement_id || '/underground_movement_v2.wav',
      52428800, -- 50MB
      'audio/wav',
      '33333333-3333-3333-3333-333333333333'::uuid,
      '{"description": "Enhanced groove with improved bassline and organic percussion", "bit_depth": 24, "sample_rate": 48000}'
    );

  -- Link files to versions
  INSERT INTO public.version_files (
    id, version_id, file_id
  ) VALUES 
    -- Midnight Reverie version files
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = midnight_reverie_id),
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v1.als')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = midnight_reverie_id),
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = midnight_reverie_id),
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v3_master.wav')
    ),
    -- Electric Dreams version files
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = electric_dreams_id),
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v1.logicx')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = electric_dreams_id),
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v2_instrumental.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = electric_dreams_id),
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_vocal_takes.zip')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v4.0' AND project_id = electric_dreams_id),
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v4_final.wav')
    ),
    -- Digital Forest version files
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = digital_forest_id),
      (SELECT id FROM public.project_files WHERE filename = 'digital_forest_v1.bitwig')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = digital_forest_id),
      (SELECT id FROM public.project_files WHERE filename = 'field_recordings.zip')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = digital_forest_id),
      (SELECT id FROM public.project_files WHERE filename = 'digital_forest_v2.wav')
    ),
    -- Neon Nights version files
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = neon_nights_id),
      (SELECT id FROM public.project_files WHERE filename = 'neon_nights_v1.flp')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = neon_nights_id),
      (SELECT id FROM public.project_files WHERE filename = 'alice_vocal_demo.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = neon_nights_id),
      (SELECT id FROM public.project_files WHERE filename = 'neon_nights_v3_final.wav')
    ),
    -- Underground Movement version files
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = underground_movement_id),
      (SELECT id FROM public.project_files WHERE filename = 'underground_movement_v1.als')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = underground_movement_id),
      (SELECT id FROM public.project_files WHERE filename = 'underground_movement_v2.wav')
    );

  -- Create activity changes (microChanges) - realistic English descriptions
  INSERT INTO public.activity_changes (
    id, version_id, type, description, author_id, file_id
  ) VALUES 
    -- Midnight Reverie v1.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = midnight_reverie_id),
      'addition',
      'Created ambient pad progression with atmospheric textures',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v1.als')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = midnight_reverie_id),
      'addition',
      'Added evolving percussion patterns with subtle automation',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v1.als')
    ),
    -- Midnight Reverie v2.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = midnight_reverie_id),
      'update',
      'Enhanced atmospheric reverb on lead elements',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = midnight_reverie_id),
      'addition',
      'Refined percussion patterns with better groove',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'midnight_reverie_v2.wav')
    ),
    -- Electric Dreams v1.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = electric_dreams_id),
      'addition',
      'Created synthwave chord progression with vintage analog sounds',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v1.logicx')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = electric_dreams_id),
      'addition',
      'Added driving bassline with analog saturation',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v1.logicx')
    ),
    -- Electric Dreams v3.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = electric_dreams_id),
      'addition',
      'Completed vocal recording session with Alice',
      '44444444-4444-4444-4444-444444444444'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_vocal_takes.zip')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = electric_dreams_id),
      'update',
      'Applied basic vocal processing and EQ',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_vocal_takes.zip')
    ),
    -- Electric Dreams v4.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v4.0' AND project_id = electric_dreams_id),
      'update',
      'Final mix with Alice''s vocals fully integrated',
      '44444444-4444-4444-4444-444444444444'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v4_final.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v4.0' AND project_id = electric_dreams_id),
      'addition',
      'Added subtle vocal harmonies and doubling',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'electric_dreams_v4_final.wav')
    ),
    -- Digital Forest v1.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = digital_forest_id),
      'addition',
      'Initial modular synthesis exploration with VCV Rack',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'digital_forest_v1.bitwig')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = digital_forest_id),
      'addition',
      'Created evolving drone textures with analog filters',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'digital_forest_v1.bitwig')
    ),
    -- Digital Forest v2.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = digital_forest_id),
      'addition',
      'Integrated field recordings from forest locations',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'field_recordings.zip')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = digital_forest_id),
      'update',
      'Enhanced modular textures with natural ambience',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'digital_forest_v2.wav')
    ),
    -- Neon Nights v2.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = neon_nights_id),
      'addition',
      'Alice''s initial vocal demo with haunting melodies',
      '44444444-4444-4444-4444-444444444444'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'alice_vocal_demo.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = neon_nights_id),
      'update',
      'Applied basic retro processing to vocal takes',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'alice_vocal_demo.wav')
    ),
    -- Neon Nights v3.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = neon_nights_id),
      'update',
      'Final synthwave mix with Alice''s vocals and retro effects',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'neon_nights_v3_final.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = neon_nights_id),
      'addition',
      'Added vintage tape saturation and analog warmth',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'neon_nights_v3_final.wav')
    ),
    -- Underground Movement v1.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = underground_movement_id),
      'addition',
      'Created deep house foundation with organic groove',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'underground_movement_v1.als')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = underground_movement_id),
      'addition',
      'Added driving bassline with sidechain compression',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'underground_movement_v1.als')
    ),
    -- Underground Movement v2.0 changes
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = underground_movement_id),
      'update',
      'Enhanced groove with improved bassline and organic percussion',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'underground_movement_v2.wav')
    ),
    (
      gen_random_uuid(),
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = underground_movement_id),
      'addition',
      'Added subtle organic percussion elements',
      '33333333-3333-3333-3333-333333333333'::uuid,
      (SELECT id FROM public.project_files WHERE filename = 'underground_movement_v2.wav')
    );

  -- Add realistic project comments for all projects
  INSERT INTO public.project_comments (
    id, project_id, version_id, user_id, comment
  ) VALUES 
    -- Midnight Reverie comments
    (
      gen_random_uuid(),
      midnight_reverie_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = midnight_reverie_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Really loving the atmospheric pad progression! The evolving textures create such a dreamy vibe.'
    ),
    (
      gen_random_uuid(),
      midnight_reverie_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = midnight_reverie_id),
      '55555555-5555-5555-5555-555555555555'::uuid,
      'The enhanced reverb on the lead elements sounds amazing. Much more depth and space.'
    ),
    (
      gen_random_uuid(),
      midnight_reverie_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = midnight_reverie_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Final master sounds incredible! The stereo imaging and tape saturation add so much character.'
    ),
    -- Electric Dreams comments
    (
      gen_random_uuid(),
      electric_dreams_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = electric_dreams_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The synthwave chord progression is perfect! Really captures that retro-futuristic feel.'
    ),
    (
      gen_random_uuid(),
      electric_dreams_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = electric_dreams_id),
      '44444444-4444-4444-4444-444444444444'::uuid,
      'Instrumental sounds great! Ready to lay down some vocals on this. Love the analog warmth.'
    ),
    (
      gen_random_uuid(),
      electric_dreams_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = electric_dreams_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Alice''s vocal takes are incredible! The harmonies really bring this track to life.'
    ),
    (
      gen_random_uuid(),
      electric_dreams_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v4.0' AND project_id = electric_dreams_id),
      '44444444-4444-4444-4444-444444444444'::uuid,
      'Final mix sounds absolutely perfect! The vocals are so well integrated with the instrumentation.'
    ),
    -- Digital Forest comments
    (
      gen_random_uuid(),
      digital_forest_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = digital_forest_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The modular synthesis exploration is fascinating! Really organic and evolving textures.'
    ),
    (
      gen_random_uuid(),
      digital_forest_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = digital_forest_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The field recordings add such an authentic natural element. Perfect blend of digital and organic.'
    ),
    -- Neon Nights comments
    (
      gen_random_uuid(),
      neon_nights_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = neon_nights_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The vintage analog sounds are spot on! Really captures that 80s synthwave aesthetic.'
    ),
    (
      gen_random_uuid(),
      neon_nights_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = neon_nights_id),
      '44444444-4444-4444-4444-444444444444'::uuid,
      'Love the haunting melody! This vocal demo really captures the mood of the track.'
    ),
    (
      gen_random_uuid(),
      neon_nights_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = neon_nights_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The vintage tape saturation and analog warmth make this sound absolutely incredible!'
    ),
    -- Underground Movement comments
    (
      gen_random_uuid(),
      underground_movement_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v1.0' AND project_id = underground_movement_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The deep house groove is solid! Really digging the organic feel and driving bassline.'
    ),
    (
      gen_random_uuid(),
      underground_movement_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v2.0' AND project_id = underground_movement_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'Enhanced groove sounds amazing! The improved bassline and organic percussion really bring it to life.'
    );

  -- Add some threaded comments with replies
  WITH head_comment AS (
    INSERT INTO public.project_comments (id, project_id, version_id, user_id, comment)
    VALUES (
      gen_random_uuid(),
      electric_dreams_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = electric_dreams_id),
      '44444444-4444-4444-4444-444444444444'::uuid,
      'The vocal harmonies sound amazing! Should we add some subtle reverb to the background vocals?'
    )
    RETURNING id
  )
  INSERT INTO public.project_comments (id, project_id, parent_id, user_id, comment)
  SELECT gen_random_uuid(), electric_dreams_id, head_comment.id, '33333333-3333-3333-3333-333333333333'::uuid, 'Great idea! I think Valhalla Room would work perfectly for that ethereal sound.'
  FROM head_comment;

  WITH head_comment AS (
    INSERT INTO public.project_comments (id, project_id, version_id, user_id, comment)
    VALUES (
      gen_random_uuid(),
      neon_nights_id,
      (SELECT id FROM public.project_versions WHERE version_name = 'v3.0' AND project_id = neon_nights_id),
      '33333333-3333-3333-3333-333333333333'::uuid,
      'The retro processing on Alice''s vocals is perfect! Really captures that synthwave aesthetic.'
    )
    RETURNING id
  )
  INSERT INTO public.project_comments (id, project_id, parent_id, user_id, comment)
  SELECT gen_random_uuid(), neon_nights_id, head_comment.id, '44444444-4444-4444-4444-444444444444'::uuid, 'Thanks! The vintage tape saturation really makes the vocals sit perfectly in the mix.'
  FROM head_comment;

END $$;

-- Restore constraint behavior
RESET ALL;


