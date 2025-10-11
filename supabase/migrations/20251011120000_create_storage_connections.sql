begin;

-- Create storage_connections table for external storage provider OAuth tokens
-- This table stores encrypted tokens and is ONLY accessible via service role (backend-only)
do $$
begin
  if not exists (
    select 1 from pg_tables 
    where schemaname = 'public' and tablename = 'storage_connections'
  ) then
    create table public.storage_connections (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles(id) on delete cascade,
      provider text not null check (provider in ('dropbox', 'google_drive')),
      provider_account_id text,
      provider_account_name text,
      encrypted_access_token text not null,
      encrypted_refresh_token text,
      encryption_key_version text not null default 'v1',
      token_expires_at timestamptz,
      connected_at timestamptz not null default now(),
      last_used_at timestamptz,
      status text not null default 'active' check (status in ('active', 'expired', 'error')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    -- Add unique constraint: one connection per provider per user
    alter table public.storage_connections
      add constraint storage_connections_user_provider_unique 
      unique (user_id, provider);

    -- Add index for efficient lookups
    create index storage_connections_user_id_idx 
      on public.storage_connections(user_id);
    
    create index storage_connections_status_expires_idx 
      on public.storage_connections(status, token_expires_at);
  end if;
end$$;

-- Enable RLS on storage_connections
do $$
begin
  if not exists (
    select 1 from pg_tables 
    where schemaname = 'public' 
      and tablename = 'storage_connections' 
      and rowsecurity = true
  ) then
    alter table public.storage_connections enable row level security;
  end if;
end$$;

-- CRITICAL: Deny all direct access to storage_connections table
-- Forces all operations through API routes with service role client
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'storage_connections_no_direct_access'
      and schemaname = 'public' 
      and tablename = 'storage_connections'
  ) then
    create policy "storage_connections_no_direct_access"
      on public.storage_connections
      for all
      to authenticated
      using (false)
      with check (false);
  end if;
end$$;

-- Add columns to project_files table for external storage support
do $$
begin
  -- Add storage_provider column (local, dropbox, google_drive)
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'project_files' 
      and column_name = 'storage_provider'
  ) then
    alter table public.project_files 
      add column storage_provider text not null default 'local'
      check (storage_provider in ('local', 'dropbox', 'google_drive'));
  end if;

  -- Add external_file_id for provider-specific file identifiers
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'project_files' 
      and column_name = 'external_file_id'
  ) then
    alter table public.project_files 
      add column external_file_id text;
  end if;

  -- Add external_metadata for provider-specific data
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'project_files' 
      and column_name = 'external_metadata'
  ) then
    alter table public.project_files 
      add column external_metadata jsonb;
  end if;
end$$;

-- Add index for efficient provider-based queries
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' 
      and tablename = 'project_files' 
      and indexname = 'project_files_storage_provider_idx'
  ) then
    create index project_files_storage_provider_idx 
      on public.project_files(storage_provider);
  end if;
end$$;

commit;

/*
Down migration (manual notes):

-- Remove indexes
drop index if exists public.project_files_storage_provider_idx;
drop index if exists public.storage_connections_status_expires_idx;
drop index if exists public.storage_connections_user_id_idx;

-- Remove columns from project_files
alter table public.project_files drop column if exists external_metadata;
alter table public.project_files drop column if exists external_file_id;
alter table public.project_files drop column if exists storage_provider;

-- Remove RLS policy
drop policy if exists "storage_connections_no_direct_access" on public.storage_connections;

-- Remove table
drop table if exists public.storage_connections;
*/

