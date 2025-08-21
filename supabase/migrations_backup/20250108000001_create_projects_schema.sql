-- Migration: Create projects schema for music collaboration platform
-- Purpose: Set up projects, files, members, likes, comments and versions tables
-- Affected tables: projects, project_members, project_likes, project_files, file_comments, file_versions

-- Projects tabel
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    tags text[] DEFAULT '{}',
    genre text,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    downloads_enabled boolean DEFAULT true NOT NULL,
    daw_info jsonb DEFAULT '{}',
    plugins_used jsonb DEFAULT '[]',
    status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    archived_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'
);

-- Project members tabel
CREATE TABLE public.project_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Project likes tabel
CREATE TABLE public.project_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Files tabel
CREATE TABLE public.project_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    filename text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    file_type text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    collaboration_mode text DEFAULT 'feedback' CHECK (collaboration_mode IN ('real-time', 'feedback', 'read-only')),
    last_activity timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'
);

-- File comments tabel
CREATE TABLE public.file_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id uuid REFERENCES public.project_files(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    comment text NOT NULL,
    timestamp numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- File versions tabel
CREATE TABLE public.file_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id uuid REFERENCES public.project_files(id) ON DELETE CASCADE NOT NULL,
    version_number integer NOT NULL,
    file_path text NOT NULL,
    change_description text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(file_id, version_number)
);

-- Indexes voor performance
CREATE INDEX projects_owner_id_idx ON public.projects (owner_id);
CREATE INDEX projects_status_idx ON public.projects (status);
CREATE INDEX projects_created_at_idx ON public.projects (created_at);
CREATE INDEX projects_genre_idx ON public.projects (genre);
CREATE INDEX projects_is_private_idx ON public.projects (is_private);

CREATE INDEX project_members_project_id_idx ON public.project_members (project_id);
CREATE INDEX project_members_user_id_idx ON public.project_members (user_id);

CREATE INDEX project_likes_project_id_idx ON public.project_likes (project_id);
CREATE INDEX project_likes_user_id_idx ON public.project_likes (user_id);

CREATE INDEX project_files_project_id_idx ON public.project_files (project_id);
CREATE INDEX project_files_uploaded_by_idx ON public.project_files (uploaded_by);
CREATE INDEX project_files_file_type_idx ON public.project_files (file_type);

CREATE INDEX file_comments_file_id_idx ON public.file_comments (file_id);
CREATE INDEX file_comments_user_id_idx ON public.file_comments (user_id);

CREATE INDEX file_versions_file_id_idx ON public.file_versions (file_id);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies voor projects (simplified to avoid recursion)
CREATE POLICY "Projects are viewable by everyone if public"
ON public.projects FOR SELECT
TO authenticated, anon
USING (NOT is_private);

CREATE POLICY "Users can view private projects they own"
ON public.projects FOR SELECT
TO authenticated
USING (is_private AND owner_id = auth.uid());

CREATE POLICY "Users can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update projects they own"
ON public.projects FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete projects they own"
ON public.projects FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- RLS Policies voor project_members (simplified to avoid recursion)
CREATE POLICY "Users can view members of projects they have access to"
ON public.project_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id AND (
            NOT is_private OR 
            owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Project owners can manage members"
ON public.project_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id AND owner_id = auth.uid()
    )
);

-- RLS Policies voor project_likes
CREATE POLICY "Users can view likes of public projects"
ON public.project_likes FOR SELECT
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id AND NOT is_private
    )
);

CREATE POLICY "Users can like/unlike projects they have access to"
ON public.project_likes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id AND (
            NOT is_private OR 
            owner_id = auth.uid()
        )
    )
);

-- RLS Policies voor project_files
CREATE POLICY "Users can view files of projects they have access to"
ON public.project_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id AND (
            NOT is_private OR 
            owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can upload files to projects they have access to"
ON public.project_files FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = project_id AND (
            NOT is_private OR 
            owner_id = auth.uid()
        )
    )
);

-- RLS Policies voor file_comments
CREATE POLICY "Users can view comments on files they have access to"
ON public.file_comments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.project_files pf
        JOIN public.projects p ON pf.project_id = p.id
        WHERE pf.id = file_id AND (
            NOT p.is_private OR 
            p.owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can comment on files they have access to"
ON public.file_comments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_files pf
        JOIN public.projects p ON pf.project_id = p.id
        WHERE pf.id = file_id AND (
            NOT p.is_private OR 
            p.owner_id = auth.uid()
        )
    )
);

-- RLS Policies voor file_versions
CREATE POLICY "Users can view versions of files they have access to"
ON public.file_versions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.project_files pf
        JOIN public.projects p ON pf.project_id = p.id
        WHERE pf.id = file_id AND (
            NOT p.is_private OR 
            p.owner_id = auth.uid()
        )
    )
);

-- Functions voor automatische updates
CREATE OR REPLACE FUNCTION public.handle_project_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_file_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.last_activity = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_project_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE public.handle_project_updated_at();

CREATE TRIGGER handle_files_updated_at
    BEFORE UPDATE ON public.project_files
    FOR EACH ROW EXECUTE PROCEDURE public.handle_file_updated_at();

CREATE TRIGGER update_project_likes_count
    AFTER INSERT OR DELETE ON public.project_likes
    FOR EACH ROW EXECUTE PROCEDURE public.update_project_likes_count(); 