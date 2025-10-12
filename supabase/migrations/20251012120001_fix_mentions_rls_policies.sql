-- Fix RLS policies for comment_mentions and notifications
-- These tables need INSERT policies for authenticated users
-- Related to: RLS policy violations when creating mentions

begin;

-- ============================================================================
-- Fix comment_mentions INSERT policy
-- Allow authenticated users to create mentions in projects they can comment on
-- ============================================================================

-- Drop existing policies if they exist
drop policy if exists "comment_mentions_insert" on public.comment_mentions;
drop policy if exists "notifications_insert" on public.notifications;

create policy "comment_mentions_insert"
on public.comment_mentions
for insert
to authenticated
with check (
  exists (
    select 1 
    from public.project_comments pc
    join public.projects p on p.id = pc.project_id
    where pc.id = comment_mentions.comment_id
      and (
        -- User is the comment author (can mention in their own comments)
        pc.user_id = (select auth.uid())
        or
        -- User is project owner or member (can comment/mention)
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

-- ============================================================================
-- Fix notifications INSERT policy
-- Allow authenticated users to create notifications
-- ============================================================================

create policy "notifications_insert"
on public.notifications
for insert
to authenticated
with check (
  -- Users can create notifications for any user
  -- This is needed because mentions create notifications for other users
  true
);

commit;

-- ============================================================================
-- Down Migration (manual notes)
-- ============================================================================

/*
To reverse this migration:

drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "comment_mentions_insert" on public.comment_mentions;
*/

