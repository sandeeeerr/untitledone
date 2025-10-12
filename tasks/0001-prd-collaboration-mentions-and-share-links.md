# PRD: Collaboration Layer – @Mentions & Share Links

## 1. Introduction/Overview

This PRD defines a comprehensive collaboration layer for **UntitledOne** that enables seamless communication and temporary project sharing. The feature introduces **@mentions** within project comments (with autocomplete, realtime updates, dashboard overview, and email notifications) and a **1-hour invite link flow** that allows logged-in users to generate temporary share links granting viewer access to a project.

### Problem Statement
Currently, project collaborators lack:
- A way to directly notify specific team members within comment threads
- A centralized view of when and where they've been mentioned
- Quick, temporary sharing for external reviewers without permanent invitations
- Realtime awareness when they're mentioned in project discussions

### Goal
Build a modern collaboration system that improves team communication through targeted mentions and simplifies temporary project access via time-limited share links.

---

## 2. Goals

1. **Enable targeted communication** via @mentions within project comments for authenticated project members
2. **Provide visibility** through a unified mentions dashboard showing unread/read mentions with context
3. **Support flexible notifications** via email (daily digest or instant) and in-app realtime updates
4. **Simplify temporary sharing** with 1-hour single-use invite links that grant viewer access
5. **Maintain security** by requiring authentication and limiting temporary access appropriately
6. **Preserve existing workflows** by coexisting with the current email-based invitation system

---

## 3. User Stories

### @Mentions
1. **As a project collaborator**, I want to type "@username" in a comment so that I can notify a specific team member about feedback or a question.
2. **As a user typing a comment**, I want to see autocomplete suggestions when I type "@" so that I can quickly mention the right person without remembering exact usernames.
3. **As a mentioned user**, I want to see a notification badge in the app sidebar so that I know someone has mentioned me.
4. **As a mentioned user**, I want to receive a daily email digest of my mentions so that I don't miss important communications.
5. **As a user**, I want to view all my mentions in a dashboard so that I can review feedback across all projects.
6. **As a user**, I want to mark mentions as read/unread so that I can track which ones I've addressed.
7. **As a user**, I want to click on a mention notification and jump directly to the comment context (file, version, timestamp) so that I can respond quickly.

### Invite Links
8. **As a project owner**, I want to generate a temporary 1-hour share link so that I can quickly share a project preview with a client or external reviewer.
9. **As a project member**, I want to see active share links for my project so that I know who has temporary access.
10. **As a project owner**, I want to revoke an active share link early so that I can control access if plans change.
11. **As an external reviewer**, I want to use a share link to access a project (after logging in) so that I can view files, add comments, and provide feedback without a permanent invitation.
12. **As a project owner**, I want to limit the number of active share links to 3 so that sharing remains controlled and manageable.

---

## 4. Functional Requirements

### 4.1 @Mentions – Core Functionality

#### FR-1: Comment Parsing & Storage
- The system **must** parse comment text for `@username` patterns when a comment is created or updated
- The system **must** validate that mentioned usernames belong to authenticated project members (owner + members from `project_members`)
- The system **must** store mentions in a dedicated `comment_mentions` table with columns: `id`, `comment_id`, `mentioned_user_id`, `created_at`
- The system **must** only create new mention records when a comment is newly posted or edited to add a new mention

#### FR-2: Autocomplete
- The system **must** provide an autocomplete API endpoint at `GET /api/projects/[id]/members/autocomplete?q=[query]`
- The endpoint **must** return up to 5 project members whose usernames start with or contain the query string
- The response **must** include: `id`, `username` (no avatar or display name required)
- The autocomplete **must** only be accessible to authenticated project members

#### FR-3: Notification Creation
- The system **must** create an in-app notification when:
  - A new comment contains an @mention
  - An existing comment is edited to add a new @mention
- The system **must NOT** create a notification when:
  - The author mentions themselves
  - The mention is inside a resolved comment (`resolved = true`)
  - The mention already existed before the edit
- Each notification **must** store: `id`, `user_id`, `type` (e.g., "mention"), `comment_id`, `project_id`, `is_read` (default false), `created_at`, `updated_at`
- **Important**: Each mention creates exactly one notification record for the mentioned user (1:1 relationship between `comment_mentions` and `notifications`)

#### FR-4: Email Notifications
- The system **must** send email notifications for mentions based on user preferences
- Default preference: **daily digest** (sent once per day with all unread mentions)
- Optional preference: **instant** (sent immediately when mentioned)
- Email **must** include:
  - Comment excerpt (first 160 characters)
  - Deep link to the comment (with file/version/timestamp context if applicable)
  - Project name
  - Commenter name
  - Optional context: file name, version name, audio timestamp (if present)
- Emails **must** use a server-side TSX template in `src/components/templates/`
- Emails **must** be sent via Resend API (server-only)

#### FR-5: Notification Preferences
- The system **must** provide a settings page at `/settings/notifications`
- Users **must** be able to toggle:
  - Email notifications for mentions (on/off)
  - In-app notifications for mentions (on/off)
  - Email frequency: "instant" or "daily"
- Preferences **must** be stored in a `notification_preferences` table with columns: `user_id`, `email_mentions_enabled` (boolean), `in_app_mentions_enabled` (boolean), `email_frequency` (enum: 'instant', 'daily')
- Default values: email enabled (daily), in-app enabled

#### FR-6: Mentions Dashboard
- The system **must** provide a mentions dashboard at `/dashboard/mentions` or as a tab/section on the main dashboard
- The dashboard **must** display mentions in priority order:
  1. Unread mentions list (newest first)
  2. Mark as read/unread actions
  3. Direct link to comment context
  4. Filter by read/unread status
  5. Group by project (lower priority)
- Each mention entry **must** show:
  - Project name
  - Comment excerpt (first 100 characters)
  - Commenter name
  - Time ago (e.g., "2 hours ago")
  - Read/unread indicator
  - Context label (e.g., "File: drums.wav at 1:23" or "Version: v1.0")
- Clicking a mention **must** navigate to the project page with the comment thread expanded and scrolled into view

#### FR-7: Realtime Updates
- The system **must** use Supabase Realtime to broadcast mention events
- Events to broadcast:
  - New mention created
  - Comment with mention edited (new @ added)
  - Comment with mention deleted
  - Mention marked as read
- The UI **must** update:
  - Sidebar badge count (unread mentions)
  - Auto-refresh the comment list if the user is viewing the affected project
  - Optional: Toast notification for new mentions
- Realtime channel: `mentions:[user_id]`

---

### 4.2 Invite Link Flow

#### FR-8: Link Generation
- The system **must** provide an API endpoint at `POST /api/projects/[id]/share-links` to generate a new share link
- The endpoint **must** only be accessible to project owners and members
- Each link **must**:
  - Be valid for exactly 1 hour from creation
  - Be single-use (one user can claim it)
  - Have a unique, secure token (e.g., UUID or cryptographically secure random string)
- The system **must** enforce a maximum of 3 active (non-expired, unused) share links per project
- The system **must** store links in a `project_share_links` table with columns: `id`, `project_id`, `token`, `created_by`, `expires_at`, `used_by` (nullable), `used_at` (nullable), `revoked` (boolean), `created_at`

#### FR-9: Link Revocation
- The system **must** provide an API endpoint at `DELETE /api/projects/[id]/share-links/[linkId]` to revoke a link
- Only the link creator or project owner **must** be able to revoke a link
- Revoking a link **must** set `revoked = true`
- Revoked links **must** return a 403 or 410 error if accessed

#### FR-10: Link Redemption
- The system **must** provide an API endpoint at `GET /api/share/[token]` to redeem a share link
- The endpoint **must**:
  - Verify the user is authenticated (redirect to login if not)
  - Check the token is valid (not expired, not used, not revoked)
  - Check the project exists and is not deleted
- On success, the system **must**:
  - Create a `project_members` record with `role = 'viewer'` and `user_id = current user`
  - Mark the link as used (`used_by = user_id`, `used_at = now()`)
  - Redirect the user to the project page
- On failure, the system **must** return an error page with a clear message (expired, already used, revoked, etc.)

#### FR-11: Viewer Role Permissions
- A user with `role = 'viewer'` **must** be able to:
  - View project details (name, description, tags, genre, etc.)
  - View all project files
  - Download files (if `downloads_enabled = true` on the project)
  - Add comments (read and write)
  - View existing comments and threads
  - View activity changes and versions
- A viewer **must NOT** be able to:
  - Edit project settings
  - Upload new files
  - Delete files or comments (except their own comments)
  - Invite other members
  - Create versions or activity changes directly

#### FR-12: Access Persistence
- After a share link expires (1 hour), the link itself **must** become invalid
- The granted "viewer" access **must** persist beyond the link expiration
- Viewers can continue to access the project until manually removed by the owner

#### FR-13: Active Links UI
- The project settings page **must** display a section showing active share links
- For each link, display:
  - Creation date/time
  - Expiration date/time (or "Expired" if past expiration)
  - Created by (username)
  - Status: "Active", "Used", "Expired", or "Revoked"
  - Copy link button (if active)
  - Revoke button (if active)
- The UI **must** show the count of active links (e.g., "2/3 active links")

---

### 4.3 Database Schema Requirements

#### FR-14: New Tables
The system **must** create the following tables via migration:

**`comment_mentions`**
```sql
CREATE TABLE comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES project_comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, mentioned_user_id)
);
```

**`notifications`**
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g., 'mention', 'comment', etc.
  comment_id uuid REFERENCES project_comments(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**`notification_preferences`**
```sql
CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_mentions_enabled boolean NOT NULL DEFAULT true,
  in_app_mentions_enabled boolean NOT NULL DEFAULT true,
  email_frequency text NOT NULL DEFAULT 'daily' CHECK (email_frequency IN ('instant', 'daily')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**`project_share_links`**
```sql
CREATE TABLE project_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### FR-15: Indexes
The system **must** create indexes for performance:
```sql
CREATE INDEX idx_comment_mentions_comment_id ON comment_mentions(comment_id);
CREATE INDEX idx_comment_mentions_mentioned_user_id ON comment_mentions(mentioned_user_id);
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_project_share_links_token ON project_share_links(token);
CREATE INDEX idx_project_share_links_project_id ON project_share_links(project_id);
CREATE INDEX idx_project_share_links_expires_at ON project_share_links(expires_at);
```

#### FR-16: RLS Policies
All new tables **must** have Row Level Security enabled with appropriate policies:
- `comment_mentions`: Users can read mentions in projects they have access to
- `notifications`: Users can only read/update their own notifications
- `notification_preferences`: Users can only read/update their own preferences
- `project_share_links`: Project members can view/create links; only creator/owner can revoke

**Note**: All new tables inherit the same `project_members`-based access rules already used in `project_comments`, ensuring members of a project automatically gain read/write access where appropriate.

---

### 4.4 API Endpoints

#### FR-17: Required API Routes
The system **must** implement the following API routes:

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/projects/[id]/members/autocomplete?q=[query]` | Autocomplete project members for mentions |
| `GET` | `/api/notifications` | List user's notifications (paginated, filterable by read/unread) |
| `PATCH` | `/api/notifications/[id]` | Mark notification as read/unread |
| `PATCH` | `/api/notifications/mark-all-read` | Mark all notifications as read |
| `GET` | `/api/notifications/preferences` | Get user notification preferences |
| `PUT` | `/api/notifications/preferences` | Update user notification preferences |
| `POST` | `/api/projects/[id]/share-links` | Generate a new share link |
| `GET` | `/api/projects/[id]/share-links` | List active share links for a project |
| `DELETE` | `/api/projects/[id]/share-links/[linkId]` | Revoke a share link |
| `GET` | `/api/share/[token]` | Redeem a share link (add user as viewer) |

---

## 5. Non-Goals (Out of Scope)

This feature **will NOT** include:

1. **Reactions/emoji** to comments (e.g., 👍, ❤️)
2. **Special mention types** like `@all`, `@channel`, or `@here`
3. **Mobile push notifications** (only email + in-app web)
4. **Mention analytics/statistics** (e.g., most mentioned user, mention heatmap)
5. **Per-project notification preferences** (global settings only)
6. **"Do Not Disturb" mode** or quiet hours
7. **Mention search** or filtering within comments
8. **Multi-use invite links** (always single-use)
9. **Custom expiration times** for share links (always 1 hour)
10. **Separate "guest" user type** (viewers are regular authenticated users with limited role)

---

## 6. Design Considerations

### 6.1 UI/UX Requirements

#### Mentions Dashboard
- Use a clean, list-based layout similar to GitHub notifications
- Show unread mentions with a blue dot or highlighted background
- Include a "Mark all as read" button
- Use skeleton loaders while fetching mentions
- Empty state: "No mentions yet" with an illustration

#### Autocomplete Dropdown
- Trigger autocomplete when user types `@` followed by any character
- Position dropdown below the cursor or @ symbol
- Keyboard navigation: Arrow up/down to select, Enter to insert, Esc to close
- Mouse hover to highlight suggestions
- Debounce API calls (300ms) to avoid excessive requests

#### Share Link UI
- Use a modal/dialog to generate a new link
- Show a success message with "Copy link" button
- Display countdown timer or expiration time clearly
- Use color coding: green for active, gray for expired/used, red for revoked

#### Settings Page
- Add a new "Notifications" tab to the existing settings page
- Use toggle switches (shadcn/ui `Switch` component)
- Use radio buttons for email frequency selection
- Save changes with a "Save preferences" button (show success toast)

### 6.2 Component Structure (Atomic Design)

**Atoms:**
- `MentionBadge` – Small badge showing `@username`
- `NotificationDot` – Unread indicator dot
- `LinkStatusBadge` – Badge showing link status (Active, Expired, etc.)

**Molecules:**
- `MentionAutocomplete` – Autocomplete dropdown with user list
- `NotificationItem` – Single notification entry with avatar, text, timestamp
- `ShareLinkCard` – Card showing link details with copy/revoke actions

**Organisms:**
- `MentionsDashboard` – Full mentions list with filters
- `NotificationSettings` – Settings form with toggles and radio buttons
- `ShareLinksManager` – List of active share links with creation form

**Templates:**
- `MentionEmailTemplate` – TSX email template for mention notifications

### 6.3 Internationalization (i18n)

All user-facing strings **must** use `next-intl` with scoped translation keys:

```json
{
  "mentions": {
    "dashboard_title": "Mentions",
    "mark_all_read": "Mark all as read",
    "no_mentions": "No mentions yet",
    "filter_unread": "Unread",
    "filter_all": "All"
  },
  "notifications": {
    "settings_title": "Notification Preferences",
    "email_enabled": "Email notifications for mentions",
    "in_app_enabled": "In-app notifications",
    "email_frequency_label": "Email frequency",
    "email_frequency_instant": "Instant",
    "email_frequency_daily": "Daily digest"
  },
  "share_links": {
    "generate_link": "Generate share link",
    "copy_link": "Copy link",
    "revoke_link": "Revoke",
    "expires_in": "Expires in {time}",
    "link_expired": "Expired",
    "link_used": "Used",
    "max_links_reached": "Maximum of 3 active links reached"
  }
}
```

---

## 7. Technical Considerations

### 7.1 Mention Parsing
- Use a regex pattern to extract `@username` from comment text: `/(?:^|\s)@([a-zA-Z0-9_-]+)/g`
- Validate extracted usernames against `profiles.username` joined with `project_members`
- Store only valid mentions in `comment_mentions` table

### 7.2 Realtime Implementation
- Use Supabase Realtime channels to broadcast mention events
- Subscribe to `mentions:[user_id]` channel on client mount
- Broadcast events from server-side API routes using Supabase service role client
- Handle reconnection and message replay to avoid missing notifications

### 7.3 Email Sending
- Use a scheduled cron job (Edge Function or Next.js API route) to send daily digests at 9 AM UTC
- For instant emails, trigger immediately after notification creation (use a queue or direct API call)
- Use React Email or similar library to build TSX templates
- Handle email failures gracefully (log errors, retry with exponential backoff)

### 7.4 Token Security
- Generate share link tokens using `crypto.randomUUID()` or `crypto.getRandomValues()`
- Store tokens hashed if needed for extra security (compare with constant-time equality)
- Use HTTPS only for share link URLs
- Validate token format on redemption to prevent injection attacks

### 7.5 Performance Optimization
- Cache project member lists for autocomplete (invalidate on member add/remove)
- Paginate mentions dashboard (load 20 at a time, infinite scroll or "Load more")
- Use Supabase query filters to fetch only unread notifications by default
- Create compound indexes for frequent queries (e.g., `user_id, is_read, created_at`)

### 7.6 Integration with Existing Systems
- **Comments API** (`/api/projects/[id]/comments`): Extend POST/PATCH to parse mentions and create notification records
- **Supabase Client**: Use existing server/client helpers in `src/lib/supabase/`
- **Email**: Use existing Resend integration (ensure `RESEND_API_KEY` is set)
- **Auth**: Leverage existing `createServerClient()` and RLS policies for access control

---

## 8. Success Metrics

### 8.1 Adoption Metrics
- **Mention Usage**: % of comments containing @mentions (target: 30% within first month)
- **Dashboard Engagement**: % of users visiting mentions dashboard weekly (target: 50%)
- **Share Link Usage**: Average share links generated per project per week (target: 2)

### 8.2 Engagement Metrics
- **Response Time**: Average time from mention notification to user response (target: < 24 hours)
- **Email Open Rate**: % of mention emails opened (target: > 40%)
- **Link Redemption Rate**: % of generated share links that are redeemed (target: > 70%)

### 8.3 System Health Metrics
- **Realtime Latency**: Time from mention creation to notification delivery (target: < 2 seconds)
- **Email Delivery Rate**: % of emails successfully delivered (target: > 98%)
- **API Response Time**: P95 latency for autocomplete and notification APIs (target: < 200ms)

---

## 9. Open Questions

1. **Mention Deduplication**: If a user edits a comment multiple times adding/removing the same mention, should we deduplicate notifications or create a new one each time?
   
2. **Viewer Removal**: Should viewer access auto-expire after a certain period (e.g., 7 days), or persist indefinitely until manually removed?

3. **Notification Retention**: How long should we keep read notifications? Should there be an auto-cleanup policy (e.g., delete read notifications older than 90 days)?

4. **Mention Formatting**: Should mentions in comments be styled differently (e.g., blue link, bold text) to distinguish them from regular text?

5. **Thread Context**: When clicking a mention, should the entire thread be expanded, or just the specific comment with context above/below?

6. **Email Unsubscribe**: Should mention emails include an unsubscribe link that directly toggles notification preferences, or should users go to settings?

7. **Share Link Analytics**: Should we track basic metrics like "link generated" and "link redeemed" events for product analytics, even if we don't show them to users?

8. **Concurrent Link Usage**: If a link is single-use, but two users click it simultaneously, how should we handle the race condition? (First-come-first-served, or error for both?)

---

## 10. Dependencies & Prerequisites

### 10.1 Technical Dependencies
- Supabase Realtime enabled for `notifications` table
- Resend API key configured in `.env` (already set up)
- Email domain verified in Resend for sending (DKIM/SPF)
- React Email or similar library for TSX templates

### 10.2 Migration Order
1. Create `notification_preferences` table (with default values)
2. Create `comment_mentions` table
3. Create `notifications` table
4. Create `project_share_links` table
5. Update `project_members` RLS policies to support "viewer" role
6. Create indexes for all new tables

### 10.3 Feature Flags
Consider using feature flags to gradually roll out:
- Phase 1: @mentions + in-app notifications (no email)
- Phase 2: Email notifications (daily digest only)
- Phase 3: Instant email + realtime updates
- Phase 4: Share links

---

## 11. Implementation Notes for Developers

### 11.1 Comment Mention Parsing (Backend)
When a comment is created or updated:
```typescript
// Pseudo-code
const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_-]+)/g;
const matches = [...comment.matchAll(mentionRegex)];
const usernames = matches.map(m => m[1]);

// Validate usernames are project members
const validMembers = await supabase
  .from('profiles')
  .select('id, username')
  .in('username', usernames)
  .in('id', projectMemberIds);

// Create mention records
for (const member of validMembers) {
  if (member.id !== authorId && !resolvedComment) {
    await supabase.from('comment_mentions').insert({
      comment_id: commentId,
      mentioned_user_id: member.id,
    });
    await createNotification(member.id, 'mention', commentId, projectId);
  }
}
```

### 11.2 Autocomplete (Frontend)
Use debounced search with TanStack Query:
```typescript
const { data: suggestions } = useQuery({
  queryKey: ['members', projectId, searchQuery],
  queryFn: () => fetch(`/api/projects/${projectId}/members/autocomplete?q=${searchQuery}`),
  enabled: searchQuery.length > 0,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

### 11.3 Realtime Subscription (Frontend)
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`mentions:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, handleNewNotification)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [userId]);
```

### 11.4 Email Template (TSX)
Use a template similar to existing email templates:
```tsx
// src/components/templates/mention-email.tsx
export function MentionEmail({ 
  userName, projectName, commentExcerpt, linkUrl, context 
}) {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Hi {userName},</Text>
        <Text>You were mentioned in {projectName}:</Text>
        <Text style={{ fontStyle: 'italic' }}>"{commentExcerpt}"</Text>
        {context && <Text>Context: {context}</Text>}
        <Button href={linkUrl}>View Comment</Button>
      </Body>
    </Html>
  );
}
```

---

## 12. Rollout Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Create database migrations for all new tables
- [ ] Update RLS policies for viewer role
- [ ] Implement mention parsing logic in comments API
- [ ] Build autocomplete API endpoint

### Phase 2: In-App Notifications (Week 3-4)
- [ ] Build mentions dashboard UI
- [ ] Implement notification creation logic
- [ ] Add badge count to sidebar
- [ ] Build notification preferences settings page

### Phase 3: Email Notifications (Week 5)
- [ ] Create email templates
- [ ] Implement daily digest cron job
- [ ] Add instant email trigger
- [ ] Test email delivery and formatting

### Phase 4: Realtime Updates (Week 6)
- [ ] Set up Supabase Realtime channels
- [ ] Implement client-side subscriptions
- [ ] Add toast notifications
- [ ] Test realtime latency and reliability

### Phase 5: Share Links (Week 7-8)
- [ ] Build share link generation API
- [ ] Implement token redemption flow
- [ ] Create share links manager UI
- [ ] Add revocation functionality
- [ ] Test access persistence and expiration

### Phase 6: Testing & Polish (Week 9)
- [ ] End-to-end testing (Cypress)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation and user guides

---

## 13. Acceptance Criteria

### AC-1: @Mentions
- [ ] Users can type `@` in a comment and see autocomplete suggestions
- [ ] Autocomplete shows up to 5 project members matching the query
- [ ] Selecting a suggestion inserts `@username` into the comment
- [ ] Mentioned users receive an in-app notification
- [ ] Mentioned users appear in the mentions dashboard with unread indicator
- [ ] Clicking a mention navigates to the comment with full context
- [ ] Self-mentions do not create notifications
- [ ] Mentions in resolved comments do not create notifications

### AC-2: Email Notifications
- [ ] Users receive daily digest emails by default
- [ ] Users can switch to instant email notifications in settings
- [ ] Emails include comment excerpt (≤160 chars), project name, commenter name, and link
- [ ] Emails include context (file/version/timestamp) when applicable
- [ ] Users can toggle email notifications on/off in settings
- [ ] Email templates render correctly in major email clients (Gmail, Outlook, Apple Mail)

### AC-3: Realtime Updates
- [ ] New mentions appear in sidebar badge count within 2 seconds
- [ ] Comment list auto-refreshes when a new mention is added
- [ ] Optional toast notification appears for new mentions
- [ ] Realtime updates work across browser tabs
- [ ] Marking a mention as read updates badge count in realtime

### AC-4: Share Links
- [ ] Users can generate a share link from project settings
- [ ] Generated links expire after exactly 1 hour
- [ ] Links are single-use (one user can redeem)
- [ ] Maximum 3 active links per project enforced
- [ ] Users must log in to redeem a link
- [ ] Redeemed users gain "viewer" role and can view/comment/download
- [ ] Expired links show a clear error message
- [ ] Users can revoke active links early
- [ ] Viewer access persists after link expiration

### AC-5: UI/UX
- [ ] Mentions dashboard has loading, empty, and error states
- [ ] Autocomplete has keyboard navigation (arrows, Enter, Esc)
- [ ] Settings page saves preferences with success/error feedback
- [ ] Share link manager shows link status (active, expired, used, revoked)
- [ ] All text uses i18n translation keys (no hardcoded strings)
- [ ] Components follow Atomic Design structure

### AC-6: Performance
- [ ] Autocomplete API responds in < 200ms (P95)
- [ ] Mentions dashboard loads in < 500ms (P95)
- [ ] Realtime notification delivery < 2 seconds
- [ ] Email delivery rate > 98%

---

**End of PRD**

