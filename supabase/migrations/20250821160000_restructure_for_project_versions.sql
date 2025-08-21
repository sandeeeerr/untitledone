-- Migration: Restructure for project versions instead of file versions
-- This replaces the old file_versions approach with a more logical project_versions structure

-- First, drop the old tables that we're replacing
DROP TABLE IF EXISTS file_versions CASCADE;
DROP TABLE IF EXISTS file_comments CASCADE;

-- Create new project_versions table
CREATE TABLE project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_type text NOT NULL CHECK (version_type IN ('semantic', 'date', 'custom')),
  version_name text NOT NULL, -- auto-generated: v1.0, 21/08/2024, or custom
  description text NOT NULL, -- user-provided description
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_active boolean DEFAULT false
);

-- Create a unique index to ensure only one active version per project
CREATE UNIQUE INDEX idx_project_versions_one_active_per_project 
ON project_versions(project_id) 
WHERE is_active = true;

-- Create version_files table to link files to versions
CREATE TABLE version_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  copied_from_version_id uuid REFERENCES project_versions(id), -- NULL = new file
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure a file can only be in one version at a time
  UNIQUE(file_id)
);

-- Create activity_changes table for microChanges
CREATE TABLE activity_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('addition', 'feedback', 'update')),
  description text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id),
  file_id uuid REFERENCES project_files(id), -- NULL = no file attached
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create new project_comments table (replaces file_comments)
CREATE TABLE project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_id uuid REFERENCES project_versions(id) ON DELETE CASCADE, -- NULL = project-level comment
  file_id uuid REFERENCES project_files(id) ON DELETE CASCADE, -- NULL = version-level comment
  user_id uuid NOT NULL REFERENCES profiles(id),
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remove version column from project_files (now handled by version_files)
ALTER TABLE project_files DROP COLUMN IF EXISTS version;

-- Create indexes for performance
CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_project_versions_created_at ON project_versions(created_at);
CREATE INDEX idx_project_versions_is_active ON project_versions(is_active);

CREATE INDEX idx_version_files_version_id ON version_files(version_id);
CREATE INDEX idx_version_files_file_id ON version_files(file_id);

CREATE INDEX idx_activity_changes_version_id ON activity_changes(version_id);
CREATE INDEX idx_activity_changes_created_at ON activity_changes(created_at);
CREATE INDEX idx_activity_changes_type ON activity_changes(type);

CREATE INDEX idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX idx_project_comments_version_id ON project_comments(version_id);
CREATE INDEX idx_project_comments_file_id ON project_comments(file_id);
CREATE INDEX idx_project_comments_created_at ON project_comments(created_at);

-- Enable Row Level Security
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_versions
CREATE POLICY "Users can view versions of projects they have access to"
ON project_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND (
      NOT is_private OR 
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project owners can create versions"
ON project_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Project owners can update versions"
ON project_versions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND owner_id = auth.uid()
  )
);

-- RLS Policies for version_files
CREATE POLICY "Users can view files of versions they have access to"
ON version_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_versions pv
    JOIN projects p ON p.id = pv.project_id
    WHERE pv.id = version_id AND (
      NOT p.is_private OR 
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project owners can manage version files"
ON version_files FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_versions pv
    JOIN projects p ON p.id = pv.project_id
    WHERE pv.id = version_id AND p.owner_id = auth.uid()
  )
);

-- RLS Policies for activity_changes
CREATE POLICY "Users can view activity changes of projects they have access to"
ON activity_changes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_versions pv
    JOIN projects p ON p.id = pv.project_id
    WHERE pv.id = version_id AND (
      NOT p.is_private OR 
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project members can create activity changes"
ON activity_changes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_versions pv
    JOIN projects p ON p.id = pv.project_id
    WHERE pv.id = version_id AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

-- RLS Policies for project_comments
CREATE POLICY "Users can view comments of projects they have access to"
ON project_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND (
      NOT is_private OR 
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Project members can create comments"
ON project_comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id AND user_id = auth.uid()
      )
    )
  )
);

-- Create a function to auto-generate version names
CREATE OR REPLACE FUNCTION generate_version_name(
  p_project_id uuid,
  p_version_type text
) RETURNS text AS $$
DECLARE
  next_version text;
  next_date text;
BEGIN
  IF p_version_type = 'semantic' THEN
    -- Find the next semantic version (v1.0, v1.1, v2.0, etc.) using numeric cast of prefix
    SELECT COALESCE(
      'v' || (MAX((regexp_match(version_name, '^v(\d+)'))[1]::int) + 1) || '.0',
      'v1.0'
    ) INTO next_version
    FROM project_versions 
    WHERE project_id = p_project_id 
      AND version_type = 'semantic'
      AND version_name ~ '^v[0-9]+\.[0-9]+$';
    
    RETURN next_version;
    
  ELSIF p_version_type = 'date' THEN
    -- Use today's date
    RETURN TO_CHAR(CURRENT_DATE, 'DD/MM/YYYY');
    
  ELSE
    -- Custom type - return as-is (will be set by user)
    RETURN '';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate version names
CREATE OR REPLACE FUNCTION auto_generate_version_name()
RETURNS trigger AS $$
BEGIN
  IF NEW.version_name IS NULL OR NEW.version_name = '' THEN
    NEW.version_name := generate_version_name(NEW.project_id, NEW.version_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_generate_version_name
  BEFORE INSERT ON project_versions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_version_name();
