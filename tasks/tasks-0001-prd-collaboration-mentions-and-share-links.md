# Tasks: Collaboration Layer – @Mentions & Share Links

Generated from: `0001-prd-collaboration-mentions-and-share-links.md`

## Current State Assessment

### Existing Infrastructure
- **Database**: Supabase with timestamped migrations in `supabase/migrations/`
- **API Routes**: Server-first Next.js API routes in `src/app/api/`
- **Components**: Atomic Design structure (atoms, molecules, organisms, templates)
- **Data Fetching**: TanStack Query with custom hooks in `src/lib/api/`
- **i18n**: next-intl with translation files in `src/i18n/messages/`
- **Settings**: Existing layout at `/settings` with sidebar navigation
- **Comments**: Existing comment system at `/api/projects/[id]/comments`

### Relevant Patterns
- RLS policies follow `project_members`-based access control
- Zod schemas for API validation
- Server Components by default, `"use client"` only when needed
- Toast notifications via `useToast` hook
- Realtime: Not yet implemented (new capability)

---

## Relevant Files

### Database & Migrations
- `supabase/migrations/20251012120000_add_mentions_and_share_links.sql` - Main migration file with all 4 tables, indexes, RLS policies, and triggers (created)

### API Routes
- `src/app/api/projects/[id]/comments/route.ts` - Extended with mention parsing and notification creation (modified)
- `src/app/api/projects/[id]/comments/[commentId]/route.ts` - Extended PUT handler to detect new mentions on edit (modified)
- `src/app/api/projects/[id]/members/autocomplete/route.ts` - Autocomplete endpoint (new)
- `src/app/api/notifications/route.ts` - List notifications (new)
- `src/app/api/notifications/[id]/route.ts` - Update notification (new)
- `src/app/api/notifications/mark-all-read/route.ts` - Bulk update (new)
- `src/app/api/notifications/preferences/route.ts` - Get/update preferences (new)
- `src/app/api/projects/[id]/share-links/route.ts` - Generate/list links (new)
- `src/app/api/projects/[id]/share-links/[linkId]/route.ts` - Revoke link (new)
- `src/app/api/share/[token]/route.ts` - Redeem share link (new)

### Pages & Routes
- `src/app/dashboard/mentions/page.tsx` - Mentions dashboard (new)
- `src/app/settings/notifications/page.tsx` - Notification settings (new)
- `src/app/share/[token]/page.tsx` - Share link redemption page (new)
- `src/app/share/[token]/error/page.tsx` - Share link error page (new)

### Components - Atoms
- `src/components/atoms/mention-badge.tsx` - Display @username (new)
- `src/components/atoms/notification-dot.tsx` - Unread indicator (new)
- `src/components/atoms/link-status-badge.tsx` - Link status badge (new)

### Components - Molecules
- `src/components/molecules/mention-autocomplete.tsx` - Autocomplete dropdown (new)
- `src/components/molecules/notification-item.tsx` - Single notification entry (new)
- `src/components/molecules/share-link-card.tsx` - Share link display card (new)

### Components - Organisms
- `src/components/organisms/mentions-dashboard.tsx` - Full mentions list (new)
- `src/components/organisms/notification-settings.tsx` - Settings form (new)
- `src/components/organisms/share-links-manager.tsx` - Share links manager (new)
- `src/components/organisms/layout-sidebar.tsx` - Add notification badge (existing, modify)

### Components - Templates
- `src/components/templates/mention-email.tsx` - Email template (new)

### API Library & Queries
- `src/lib/api/notifications.ts` - Notification API functions (new)
- `src/lib/api/share-links.ts` - Share link API functions (new)
- `src/lib/api/queries.ts` - Add TanStack Query hooks (existing, extend)
- `src/lib/api/comments.ts` - May need mention helpers (existing, possibly extend)

### Utils & Helpers
- `src/lib/utils/mentions.ts` - Mention parsing, validation, and notification creation utilities (created)
- `src/lib/utils/share-links.ts` - Token generation/validation (new)

### Hooks
- `src/hooks/use-mention-autocomplete.ts` - Autocomplete hook (new)
- `src/hooks/use-realtime-notifications.ts` - Realtime subscription hook (new)

### i18n
- `src/i18n/messages/en.json` - Add mention/notification/share link keys (existing, extend)
- `src/i18n/messages/fr.json` - Add translations (existing, extend)
- `src/i18n/messages/nl.json` - Add translations (existing, extend)

### Edge Functions (Optional)
- `supabase/functions/send-mention-digest/index.ts` - Daily digest cron (new)

### Notes
- Files marked "existing, modify" require careful updates to maintain existing functionality
- All new API routes should follow existing patterns (Zod validation, RLS checks)
- Components must use next-intl for all text strings
- Follow Atomic Design structure strictly

---

## Tasks

### Phase 1: Foundation & Database (Week 1-2)

- [x] **1.0 Create Database Schema & Migrations**
  - [x] 1.1 Create timestamped migration file in `supabase/migrations/` (format: `YYYYMMDDHHMMSS_add_mentions_and_share_links.sql`)
  - [x] 1.2 Add `comment_mentions` table with columns: `id`, `comment_id`, `mentioned_user_id`, `created_at`, and UNIQUE constraint on `(comment_id, mentioned_user_id)`
  - [x] 1.3 Add `notifications` table with columns: `id`, `user_id`, `type`, `comment_id`, `project_id`, `is_read`, `created_at`, `updated_at`
  - [x] 1.4 Add `notification_preferences` table with columns: `user_id` (PK), `email_mentions_enabled`, `in_app_mentions_enabled`, `email_frequency`, `created_at`, `updated_at`
  - [x] 1.5 Add `project_share_links` table with columns: `id`, `project_id`, `token` (UNIQUE), `created_by`, `expires_at`, `used_by`, `used_at`, `revoked`, `created_at`
  - [x] 1.6 Create indexes: `idx_comment_mentions_comment_id`, `idx_comment_mentions_mentioned_user_id`, `idx_notifications_user_id_is_read`, `idx_notifications_created_at`, `idx_project_share_links_token`, `idx_project_share_links_project_id`, `idx_project_share_links_expires_at`
  - [x] 1.7 Enable RLS on all new tables
  - [x] 1.8 Create RLS policy for `comment_mentions` SELECT (users can read mentions in projects they have access to)
  - [x] 1.9 Create RLS policy for `comment_mentions` INSERT (system-only via service role)
  - [x] 1.10 Create RLS policies for `notifications` SELECT/UPDATE (users can only read/update their own)
  - [x] 1.11 Create RLS policies for `notification_preferences` SELECT/UPDATE (users can only manage their own)
  - [x] 1.12 Create RLS policies for `project_share_links` SELECT/INSERT (project members can view/create)
  - [x] 1.13 Create RLS policy for `project_share_links` UPDATE (only creator or project owner can revoke)
  - [x] 1.14 Add "viewer" role support by updating existing `project_members` RLS policies to include role checks where needed
  - [x] 1.15 Test migration with `supabase db reset` and verify all tables/policies are created correctly
  - [x] 1.16 Run `npm run gen:types` to regenerate TypeScript types from database schema

### Phase 2: @Mentions Core (Week 2-3)

- [x] **2.0 Implement Mention Parsing & Storage**
  - [x] 2.1 Create `src/lib/utils/mentions.ts` with `parseMentions(text: string): string[]` function using regex `/(?:^|\s)@([a-zA-Z0-9_-]+)/g`
  - [x] 2.2 Create `validateMentions(usernames: string[], projectId: string, supabase: SupabaseClient): Promise<{ id: string; username: string }[]>` to query project members
  - [x] 2.3 Create `createMentionNotifications(commentId: string, mentionedUserIds: string[], authorId: string, projectId: string, supabase: SupabaseClient)` helper function
  - [x] 2.4 Modify `src/app/api/projects/[id]/comments/route.ts` POST handler to call mention parsing after comment creation
  - [x] 2.5 Add logic to check if comment is resolved (`resolved = true`), skip notifications if so
  - [x] 2.6 Add logic to filter out author's own ID from mentioned users (no self-mentions)
  - [x] 2.7 Insert records into `comment_mentions` table for each valid mention
  - [x] 2.8 Insert records into `notifications` table for each mention (type: "mention", 1:1 with mentions)
  - [x] 2.9 Modify `src/app/api/projects/[id]/comments/[commentId]/route.ts` PUT handler to detect new mentions on edit
  - [x] 2.10 Implement deduplication: only create notifications for mentions that weren't in the previous version of the comment
  - [x] 2.11 Add error handling and logging for mention processing (non-blocking, comment creation should succeed even if mentions fail)
  - [x] 2.12 Test mention parsing with various edge cases (multiple mentions, mentions at start/middle/end, invalid usernames)

- [ ] **3.0 Build Autocomplete API & Frontend**
  - [ ] 3.1 Create `src/app/api/projects/[id]/members/autocomplete/route.ts` with GET handler
  - [ ] 3.2 Add Zod schema to validate query parameter `q` (string, min 1 char, max 50 chars)
  - [ ] 3.3 Query `profiles` joined with `project_members` WHERE `project_id = [id]` AND `username ILIKE '%[q]%'` LIMIT 5
  - [ ] 3.4 Return array of `{ id, username }` objects
  - [ ] 3.5 Add RLS check: only authenticated project members can access this endpoint
  - [ ] 3.6 Create `src/hooks/use-mention-autocomplete.ts` hook using TanStack Query with debouncing (300ms)
  - [ ] 3.7 Create `src/components/molecules/mention-autocomplete.tsx` dropdown component
  - [ ] 3.8 Add keyboard navigation: ArrowUp/ArrowDown to select, Enter to insert, Escape to close
  - [ ] 3.9 Add mouse hover states and click handlers
  - [ ] 3.10 Position dropdown below cursor/@ symbol using absolute positioning or floating-ui
  - [ ] 3.11 Trigger autocomplete when user types `@` followed by any character in a textarea/input
  - [ ] 3.12 Insert `@username` at cursor position when suggestion is selected
  - [ ] 3.13 Integrate autocomplete into existing comment forms (find all comment textareas in the app)
  - [ ] 3.14 Add loading state (spinner) while fetching suggestions
  - [ ] 3.15 Add empty state when no members match the query
  - [ ] 3.16 Test autocomplete with keyboard-only navigation (accessibility)

### Phase 3: Notifications & Dashboard (Week 3-4)

- [ ] **4.0 Build Notifications Dashboard**
  - [ ] 4.1 Create `src/app/dashboard/mentions/page.tsx` as Server Component
  - [ ] 4.2 Create `src/lib/api/notifications.ts` with `getNotifications(filter?: 'unread' | 'all', limit?: number, offset?: number)` function
  - [ ] 4.3 Create API route `src/app/api/notifications/route.ts` GET handler with pagination and filtering
  - [ ] 4.4 Add Zod schema for query params: `filter` (enum), `limit` (number, max 100), `cursor` (timestamp for pagination)
  - [ ] 4.5 Query `notifications` joined with `project_comments`, `profiles` (commenter), and `projects` for full context
  - [ ] 4.6 Create `src/components/atoms/notification-dot.tsx` - small blue dot for unread indicator
  - [ ] 4.7 Create `src/components/molecules/notification-item.tsx` displaying: project name, comment excerpt (100 chars), commenter name, time ago, read/unread indicator, context label
  - [ ] 4.8 Create `src/components/organisms/mentions-dashboard.tsx` with filter buttons (Unread/All) and "Mark all as read" button
  - [ ] 4.9 Add loading state using skeleton loaders
  - [ ] 4.10 Add empty state with illustration and message "No mentions yet"
  - [ ] 4.11 Implement "Mark as read" action for individual notifications via API call
  - [ ] 4.12 Create API route `src/app/api/notifications/[id]/route.ts` PATCH handler to update `is_read` field
  - [ ] 4.13 Create API route `src/app/api/notifications/mark-all-read/route.ts` PATCH handler to bulk update
  - [ ] 4.14 Add deep linking: clicking a notification navigates to `/projects/[projectId]?comment=[commentId]&highlight=true`
  - [ ] 4.15 Implement scroll-to-comment logic on the project page when `comment` query param is present
  - [ ] 4.16 Add pagination (infinite scroll or "Load more" button) for notifications list
  - [ ] 4.17 Add error handling and error state UI
  - [ ] 4.18 Test navigation from notification to comment with various contexts (file, version, activity)

- [ ] **5.0 Implement Notification Preferences**
  - [ ] 5.1 Create `src/app/settings/notifications/page.tsx` (Client Component with `"use client"`)
  - [ ] 5.2 Update `src/app/settings/layout.tsx` to enable "Notifications" nav item (remove `disabled: true`)
  - [ ] 5.3 Create API route `src/app/api/notifications/preferences/route.ts` with GET and PUT handlers
  - [ ] 5.4 GET handler: fetch preferences from `notification_preferences` table, or return defaults if none exist
  - [ ] 5.5 PUT handler: upsert preferences with Zod validation (`email_mentions_enabled`, `in_app_mentions_enabled`, `email_frequency`)
  - [ ] 5.6 Create `src/components/organisms/notification-settings.tsx` form component
  - [ ] 5.7 Add toggle switches (shadcn/ui `Switch`) for email notifications and in-app notifications
  - [ ] 5.8 Add radio buttons for email frequency ("Instant" / "Daily digest")
  - [ ] 5.9 Add "Save preferences" button with loading state
  - [ ] 5.10 Show success toast on save, error toast on failure
  - [ ] 5.11 Use TanStack Query mutation for preferences update with optimistic updates
  - [ ] 5.12 Add database trigger or default insertion: when a new user is created, insert default preferences (email: daily, in-app: true)
  - [ ] 5.13 Modify user creation function/trigger (`handle_new_user` in baseline migration) to create default preferences
  - [ ] 5.14 Test preferences persistence (save, reload page, verify settings are retained)
  - [ ] 5.15 Add form validation and disable save button if no changes

### Phase 4: Email Notifications (Week 5)

- [ ] **6.0 Build Email Notification System**
  - [ ] 6.1 Install React Email library: `npm install @react-email/components @react-email/render`
  - [ ] 6.2 Create `src/components/templates/mention-email.tsx` TSX email template component
  - [ ] 6.3 Template should include: greeting, "You were mentioned in [projectName]", comment excerpt (160 chars), context info (file/version/timestamp), "View Comment" button with deep link
  - [ ] 6.4 Style email using inline styles (email-safe CSS)
  - [ ] 6.5 Test email rendering locally using React Email preview: `npx email dev`
  - [ ] 6.6 Create `src/lib/api/emails.ts` with `sendMentionEmail(to: string, userName: string, projectName: string, commentExcerpt: string, linkUrl: string, context?: string)` function
  - [ ] 6.7 Use `render` from `@react-email/render` to convert TSX to HTML
  - [ ] 6.8 Integrate with Resend: POST to Resend API with rendered HTML (ensure `RESEND_API_KEY` is in env)
  - [ ] 6.9 Add instant email trigger: in mention notification creation logic (task 2.8), check user preferences; if `email_frequency = 'instant'` and `email_mentions_enabled = true`, send email immediately
  - [ ] 6.10 Create Supabase Edge Function `supabase/functions/send-mention-digest/index.ts` for daily digest
  - [ ] 6.11 Edge Function should query `notifications` WHERE `type = 'mention'` AND `is_read = false` AND user has `email_frequency = 'daily'` AND `email_mentions_enabled = true`
  - [ ] 6.12 Group notifications by user, aggregate into digest email (list all unread mentions)
  - [ ] 6.13 Send one email per user with all their unread mentions
  - [ ] 6.14 Schedule Edge Function via Supabase cron: daily at 9 AM UTC (add to `supabase/config.toml` or use external scheduler)
  - [ ] 6.15 Add error handling and retry logic for failed email sends (log errors, exponential backoff)
  - [ ] 6.16 Test instant email flow end-to-end (create mention, verify email received)
  - [ ] 6.17 Test digest email flow (set preference to daily, create mentions throughout the day, verify digest arrives at scheduled time)
  - [ ] 6.18 Verify email renders correctly in Gmail, Outlook, and Apple Mail

### Phase 5: Realtime Updates (Week 6)

- [ ] **7.0 Implement Realtime Notifications**
  - [ ] 7.1 Enable Supabase Realtime for `notifications` table in Supabase dashboard or via migration
  - [ ] 7.2 Create `src/hooks/use-realtime-notifications.ts` hook to subscribe to notification changes
  - [ ] 7.3 Subscribe to `postgres_changes` event on `notifications` table filtered by `user_id = current user`
  - [ ] 7.4 Handle INSERT, UPDATE, and DELETE events
  - [ ] 7.5 On INSERT: increment unread count, optionally show toast notification
  - [ ] 7.6 On UPDATE (is_read changed): decrement unread count if marked as read
  - [ ] 7.7 On DELETE: update UI accordingly
  - [ ] 7.8 Modify `src/components/organisms/layout-sidebar.tsx` to add notification badge to sidebar/navbar
  - [ ] 7.9 Create badge component showing unread count (e.g., red circle with number)
  - [ ] 7.10 Fetch initial unread count on mount via API call
  - [ ] 7.11 Subscribe to realtime updates using the hook from 7.2
  - [ ] 7.12 Update badge count in real-time as notifications come in
  - [ ] 7.13 Add toast notification using `useToast` hook when new mention is received (optional, user preference)
  - [ ] 7.14 Toast should display: commenter name, project name, and link to comment
  - [ ] 7.15 Handle reconnection scenarios: if connection is lost, refetch unread count on reconnect
  - [ ] 7.16 Auto-refresh comment list on project page if user is viewing affected project and a new mention arrives
  - [ ] 7.17 Test realtime updates across multiple browser tabs (badge should sync)
  - [ ] 7.18 Test offline scenario: disconnect internet, create mention from another device, reconnect, verify badge updates
  - [ ] 7.19 Add unsubscribe logic in cleanup to prevent memory leaks

### Phase 6: Share Links (Week 7-8)

- [ ] **8.0 Build Share Link Generation & Management**
  - [ ] 8.1 Create `src/lib/utils/share-links.ts` with `generateSecureToken()` function using `crypto.randomUUID()`
  - [ ] 8.2 Add `calculateExpiry(hours: number = 1): Date` helper function returning timestamp 1 hour in the future
  - [ ] 8.3 Create API route `src/app/api/projects/[id]/share-links/route.ts` with POST handler
  - [ ] 8.4 POST: validate user is project owner or member via RLS
  - [ ] 8.5 POST: check count of active links (not expired, not used, not revoked) for this project; if >= 3, return error "Maximum of 3 active links reached"
  - [ ] 8.6 POST: generate token, insert into `project_share_links` table with `expires_at = now() + 1 hour`
  - [ ] 8.7 POST: return link object with full URL: `${NEXT_PUBLIC_SITE_URL}/share/${token}`
  - [ ] 8.8 Add GET handler to list all share links for a project (no filtering, show all: active, expired, used, revoked)
  - [ ] 8.9 Create API route `src/app/api/projects/[id]/share-links/[linkId]/route.ts` with DELETE handler
  - [ ] 8.10 DELETE: validate user is link creator or project owner
  - [ ] 8.11 DELETE: update `revoked = true` in database
  - [ ] 8.12 Create `src/components/atoms/link-status-badge.tsx` component showing "Active" (green), "Expired" (gray), "Used" (gray), "Revoked" (red)
  - [ ] 8.13 Create `src/components/molecules/share-link-card.tsx` displaying: creation date, expiration date, creator name, status badge, copy button, revoke button
  - [ ] 8.14 Add copy-to-clipboard functionality using `navigator.clipboard.writeText()` with success feedback
  - [ ] 8.15 Create `src/components/organisms/share-links-manager.tsx` with "Generate new link" button and list of existing links
  - [ ] 8.16 Add modal/dialog to generate new link (show success message with copy button)
  - [ ] 8.17 Integrate share links manager into project settings page (add new tab or section)
  - [ ] 8.18 Display count of active links: "2/3 active links"
  - [ ] 8.19 Disable "Generate" button if 3 active links already exist
  - [ ] 8.20 Add confirmation dialog for revoke action: "Are you sure you want to revoke this link?"
  - [ ] 8.21 Test link generation, listing, and revocation end-to-end
  - [ ] 8.22 Test max limit enforcement (try to create 4th link, verify error)

- [ ] **9.0 Implement Link Redemption Flow**
  - [ ] 9.1 Create `src/app/share/[token]/page.tsx` Server Component
  - [ ] 9.2 Create API route `src/app/api/share/[token]/route.ts` with GET handler
  - [ ] 9.3 GET: check if user is authenticated; if not, redirect to `/auth/login?redirect=/share/[token]`
  - [ ] 9.4 GET: fetch link from `project_share_links` WHERE `token = [token]`
  - [ ] 9.5 GET: validate link exists; if not, return 404 error
  - [ ] 9.6 GET: validate link is not expired (`expires_at > now()`); if expired, return 410 error
  - [ ] 9.7 GET: validate link is not used (`used_by IS NULL`); if used, return 410 error
  - [ ] 9.8 GET: validate link is not revoked (`revoked = false`); if revoked, return 403 error
  - [ ] 9.9 GET: fetch project to ensure it exists and is not deleted
  - [ ] 9.10 GET: check if user is already a project member; if so, skip adding them and redirect to project
  - [ ] 9.11 GET: insert into `project_members` table: `{ project_id, user_id: current user, role: 'viewer', added_by: link creator }`
  - [ ] 9.12 GET: update link: `used_by = current user`, `used_at = now()`
  - [ ] 9.13 GET: redirect to `/projects/[projectId]` with success message
  - [ ] 9.14 Create `src/app/share/[token]/error/page.tsx` for error states
  - [ ] 9.15 Error page should display different messages based on error type (expired, used, revoked, not found)
  - [ ] 9.16 Add countdown timer on share link page showing "This link expires in X minutes"
  - [ ] 9.17 Test redemption happy path (click link, log in, gain access, redirect to project)
  - [ ] 9.18 Test expired link (wait 1 hour or manually set expiry to past, try to redeem, verify error page)
  - [ ] 9.19 Test single-use enforcement (redeem link with user A, try to redeem with user B, verify error)
  - [ ] 9.20 Test revoked link (generate link, revoke it, try to redeem, verify error)
  - [ ] 9.21 Test race condition (simulate two users clicking same link simultaneously, verify only one succeeds)
  - [ ] 9.22 Verify viewer permissions: viewer can view/comment/download but cannot edit/upload/delete

### Phase 7: Testing & Polish (Week 9)

- [ ] **10.0 Testing, i18n & Documentation**
  - [ ] 10.1 Add translation keys to `src/i18n/messages/en.json` for all new UI text (mentions, notifications, share links)
  - [ ] 10.2 Add translations to `src/i18n/messages/fr.json`
  - [ ] 10.3 Add translations to `src/i18n/messages/nl.json`
  - [ ] 10.4 Review all components to ensure no hardcoded strings remain (use `next-intl` `useTranslations` hook)
  - [ ] 10.5 Write Cypress E2E test: mention flow (create comment with @mention, verify notification appears)
  - [ ] 10.6 Write Cypress E2E test: notification dashboard (view mentions, mark as read, navigate to comment)
  - [ ] 10.7 Write Cypress E2E test: share link flow (generate link, revoke link, redeem link)
  - [ ] 10.8 Write Cypress E2E test: email preferences (update settings, verify persistence)
  - [ ] 10.9 Run accessibility audit using axe-core or similar tool on mentions dashboard and settings pages
  - [ ] 10.10 Fix any accessibility issues (missing ARIA labels, keyboard navigation, color contrast)
  - [ ] 10.11 Test all components in dark mode to ensure proper theming
  - [ ] 10.12 Optimize autocomplete performance: verify debouncing works, check for unnecessary re-renders
  - [ ] 10.13 Optimize notifications API: add pagination cursor logic, test with 100+ notifications
  - [ ] 10.14 Add caching to autocomplete API responses (use TanStack Query `staleTime` of 5 minutes)
  - [ ] 10.15 Run performance tests: measure P95 latency for autocomplete (<200ms) and notifications (<500ms)
  - [ ] 10.16 Write unit tests for mention parsing utility (`src/lib/utils/mentions.ts`)
  - [ ] 10.17 Write unit tests for share link token generation (`src/lib/utils/share-links.ts`)
  - [ ] 10.18 Update project README with feature overview and setup instructions
  - [ ] 10.19 Create user guide document explaining how to use mentions and share links
  - [ ] 10.20 Add code comments and JSDoc for all new API functions
  - [ ] 10.21 Run full type check: `npm run typecheck` and fix any TypeScript errors
  - [ ] 10.22 Run linter: `npm run lint` and fix any issues
  - [ ] 10.23 Test on different browsers (Chrome, Firefox, Safari) to ensure compatibility
  - [ ] 10.24 Perform manual QA walkthrough of all acceptance criteria from PRD

---

## Summary

### Total Tasks: 10 parent tasks, 170+ sub-tasks

**Task Breakdown:**
1. **Database Schema & Migrations** (16 sub-tasks) - Foundation layer with 4 tables, indexes, and RLS policies
2. **Mention Parsing & Storage** (12 sub-tasks) - Core @mentions functionality with validation and deduplication
3. **Autocomplete API & Frontend** (16 sub-tasks) - User input enhancement with keyboard navigation
4. **Notifications Dashboard** (18 sub-tasks) - Central notification hub with filtering and deep linking
5. **Notification Preferences** (15 sub-tasks) - User settings page with email/in-app toggles
6. **Email Notification System** (18 sub-tasks) - Email integration with instant and daily digest options
7. **Realtime Notifications** (19 sub-tasks) - Live updates using Supabase Realtime
8. **Share Link Generation & Management** (22 sub-tasks) - Temporary access creation with 3-link limit
9. **Link Redemption Flow** (22 sub-tasks) - Access granting mechanism with viewer role
10. **Testing, i18n & Documentation** (24 sub-tasks) - Quality assurance, translations, and polish

### Estimated Timeline: 9 weeks

- **Week 1-2**: Foundation (Database)
- **Week 2-3**: @Mentions Core
- **Week 3-4**: Notifications & Dashboard
- **Week 5**: Email Notifications
- **Week 6**: Realtime Updates
- **Week 7-8**: Share Links
- **Week 9**: Testing & Polish

### Key Implementation Notes

1. **Follow existing patterns**: Use Zod for validation, RLS for security, TanStack Query for data fetching
2. **Server-first approach**: Keep components as Server Components by default, use `"use client"` sparingly
3. **Atomic Design**: Strictly follow atoms → molecules → organisms → templates structure
4. **i18n everywhere**: No hardcoded strings, use `next-intl` for all UI text
5. **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
6. **Performance**: Debouncing, caching, pagination, realtime optimization

---

**Status**: ✅ Complete - All tasks generated with detailed sub-tasks

**Ready for implementation!** Start with Task 1.0 (Database Schema & Migrations).

