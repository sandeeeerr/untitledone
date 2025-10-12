-- Migration: Add mentions and share links
-- This migration adds support for @mentions in comments, in-app/email notifications,
-- notification preferences, and temporary project share links with viewer role.
-- Related to: 0001-prd-collaboration-mentions-and-share-links.md

begin;

-- ============================================================================
-- Table: comment_mentions
-- Stores @mention relationships between comments and users
-- ============================================================================

create table if not exists public.comment_mentions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.project_comments(id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  
  -- Ensure a user can only be mentioned once per comment
  unique(comment_id, mentioned_user_id)
);

-- ============================================================================
-- Table: notifications
-- Stores in-app notifications for users (mentions, comments, etc.)
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- 'mention', 'comment', etc.
  comment_id uuid references public.project_comments(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- ============================================================================
-- Table: notification_preferences
-- Stores user preferences for email and in-app notifications
-- ============================================================================

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_mentions_enabled boolean not null default true,
  in_app_mentions_enabled boolean not null default true,
  email_frequency text not null default 'daily' check (email_frequency in ('instant', 'daily')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- ============================================================================
-- Table: project_share_links
-- Stores temporary 1-hour share links for granting viewer access to projects
-- ============================================================================

create table if not exists public.project_share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ============================================================================
-- Indexes for performance optimization
-- ============================================================================

-- comment_mentions indexes
create index if not exists idx_comment_mentions_comment_id 
  on public.comment_mentions(comment_id);

create index if not exists idx_comment_mentions_mentioned_user_id 
  on public.comment_mentions(mentioned_user_id);

-- notifications indexes
create index if not exists idx_notifications_user_id_is_read 
  on public.notifications(user_id, is_read);

create index if not exists idx_notifications_created_at 
  on public.notifications(created_at desc);

-- project_share_links indexes
create index if not exists idx_project_share_links_token 
  on public.project_share_links(token);

create index if not exists idx_project_share_links_project_id 
  on public.project_share_links(project_id);

create index if not exists idx_project_share_links_expires_at 
  on public.project_share_links(expires_at);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

alter table public.comment_mentions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.project_share_links enable row level security;

-- ============================================================================
-- RLS Policies: comment_mentions
-- Users can read mentions in projects they have access to
-- Mentions are created by the system (service role only)
-- ============================================================================

-- SELECT: Users can view mentions in projects they have access to
create policy "comment_mentions_select"
on public.comment_mentions
for select
to authenticated
using (
  exists (
    select 1 
    from public.project_comments pc
    join public.projects p on p.id = pc.project_id
    where pc.id = comment_mentions.comment_id
      and (
        not p.is_private
        or p.owner_id = (select auth.uid())
        or exists (
          select 1 
          from public.project_members pm
          where pm.project_id = p.id 
            and pm.user_id = (select auth.uid())
        )
      )
  )
);

-- INSERT: System-only (service role) - mentions are created by backend logic
-- No policy needed as service role bypasses RLS

-- ============================================================================
-- RLS Policies: notifications
-- Users can only read and update their own notifications
-- ============================================================================

-- SELECT: Users can read their own notifications
create policy "notifications_select"
on public.notifications
for select
to authenticated
using (
  user_id = (select auth.uid())
);

-- UPDATE: Users can update their own notifications (e.g., mark as read)
create policy "notifications_update"
on public.notifications
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);

-- ============================================================================
-- RLS Policies: notification_preferences
-- Users can only manage their own preferences
-- ============================================================================

-- SELECT: Users can read their own preferences
create policy "notification_preferences_select"
on public.notification_preferences
for select
to authenticated
using (
  user_id = (select auth.uid())
);

-- INSERT: Users can create their own preferences
create policy "notification_preferences_insert"
on public.notification_preferences
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

-- UPDATE: Users can update their own preferences
create policy "notification_preferences_update"
on public.notification_preferences
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);

-- ============================================================================
-- RLS Policies: project_share_links
-- Project members can view and create links
-- Only creator or project owner can revoke (delete)
-- ============================================================================

-- SELECT: Project members can view share links for their projects
create policy "project_share_links_select"
on public.project_share_links
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_share_links.project_id
      and (
        p.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  )
);

-- INSERT: Project members can create share links
create policy "project_share_links_insert"
on public.project_share_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_share_links.project_id
      and (
        p.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  )
);

-- UPDATE: Only creator or project owner can revoke (set revoked = true)
create policy "project_share_links_update"
on public.project_share_links
for update
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1
    from public.projects p
    where p.id = project_share_links.project_id
      and p.owner_id = (select auth.uid())
  )
)
with check (
  created_by = (select auth.uid())
  or exists (
    select 1
    from public.projects p
    where p.id = project_share_links.project_id
      and p.owner_id = (select auth.uid())
  )
);

-- ============================================================================
-- Viewer Role Support
-- Update existing project_members policies to support 'viewer' role
-- Viewers have read-only access with ability to comment
-- ============================================================================

-- Note: Existing policies on project_members, projects, project_files, etc.
-- will automatically work with the 'viewer' role since they check for membership.
-- Viewer-specific restrictions (e.g., no file uploads, no edits) are enforced
-- in application logic and specific policies on other tables.

-- ============================================================================
-- Trigger: Auto-update updated_at on notifications
-- ============================================================================

create or replace function public.update_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
before update on public.notifications
for each row
execute function public.update_notifications_updated_at();

-- ============================================================================
-- Trigger: Auto-update updated_at on notification_preferences
-- ============================================================================

create or replace function public.update_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.update_notification_preferences_updated_at();

-- ============================================================================
-- Function: Create default notification preferences on user creation
-- Updates the existing handle_new_user function to include preferences
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create (or update) profile record for the new auth user
  insert into public.profiles (id, username, display_name, avatar_url, updated_at)
  values (
    new.id,
    coalesce( (new.raw_user_meta_data->>'username'), split_part(new.email, '@', 1) ),
    coalesce( (new.raw_user_meta_data->>'full_name'), new.email ),
    null,
    now()
  )
  on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name,
        updated_at = now();

  -- Create default notification preferences
  insert into public.notification_preferences (user_id, email_mentions_enabled, in_app_mentions_enabled, email_frequency)
  values (new.id, true, true, 'daily')
  on conflict (user_id) do nothing;

  return new;
end
$$;

commit;

-- ============================================================================
-- Down Migration (manual notes)
-- ============================================================================

/*
To reverse this migration:

-- Drop triggers
drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
drop trigger if exists trg_notifications_updated_at on public.notifications;

-- Drop functions
drop function if exists public.update_notification_preferences_updated_at();
drop function if exists public.update_notifications_updated_at();

-- Restore original handle_new_user function (remove notification_preferences insert)

-- Drop policies
drop policy if exists "project_share_links_update" on public.project_share_links;
drop policy if exists "project_share_links_insert" on public.project_share_links;
drop policy if exists "project_share_links_select" on public.project_share_links;
drop policy if exists "notification_preferences_update" on public.notification_preferences;
drop policy if exists "notification_preferences_insert" on public.notification_preferences;
drop policy if exists "notification_preferences_select" on public.notification_preferences;
drop policy if exists "notifications_update" on public.notifications;
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "comment_mentions_select" on public.comment_mentions;

-- Drop indexes
drop index if exists public.idx_project_share_links_expires_at;
drop index if exists public.idx_project_share_links_project_id;
drop index if exists public.idx_project_share_links_token;
drop index if exists public.idx_notifications_created_at;
drop index if exists public.idx_notifications_user_id_is_read;
drop index if exists public.idx_comment_mentions_mentioned_user_id;
drop index if exists public.idx_comment_mentions_comment_id;

-- Drop tables
drop table if exists public.project_share_links;
drop table if exists public.notification_preferences;
drop table if exists public.notifications;
drop table if exists public.comment_mentions;
*/

