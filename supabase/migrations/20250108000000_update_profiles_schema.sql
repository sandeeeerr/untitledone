-- Migration: Update profiles table for display_name and improved username handling
-- Purpose: Rename full_name to display_name and add better username generation

-- Rename full_name column to display_name
ALTER TABLE public.profiles RENAME COLUMN full_name TO display_name;

-- Create function to generate unique username from display name
CREATE OR REPLACE FUNCTION public.generate_unique_username(display_name text)
RETURNS text AS $$
DECLARE
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    -- Convert display name to slug format
    base_username := lower(regexp_replace(display_name, '[^a-zA-Z0-9]', '', 'g'));
    
    -- If base_username is empty after cleaning, use 'user'
    IF base_username = '' THEN
        base_username := 'user';
    END IF;
    
    -- Try base_username first
    final_username := base_username;
    
    -- If username exists, add number until we find a unique one
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;
    
    RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to use display_name and generate username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    generated_username text;
BEGIN
    -- Generate unique username from display_name
    generated_username := public.generate_unique_username(
        COALESCE(new.raw_user_meta_data->>'display_name', new.email)
    );
    
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        new.id,
        generated_username,
        COALESCE(new.raw_user_meta_data->>'display_name', new.email)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 