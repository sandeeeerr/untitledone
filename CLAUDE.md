# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UntitledOne is an open-source platform for remote collaboration between audio creatives, featuring file sharing, time-based feedback on waveforms, and lightweight project management. Built with Next.js 15, Supabase, TypeScript, and shadcn/ui.

## Common Commands

### Development
```bash
pnpm dev                  # Start dev server on port 3000
pnpm typecheck            # Run TypeScript type checking
pnpm lint                 # Run ESLint
pnpm format               # Format with Prettier (includes Tailwind plugin)
pnpm gen:types            # Generate Supabase DB types from schema
```

### Testing
```bash
pnpm test                 # Run Vitest unit tests
pnpm cypress:open         # Open Cypress for E2E tests
pnpm cypress:run          # Run Cypress tests headless
```

### Component Development
```bash
pnpm storybook            # Run Storybook on port 6006
pnpm build-storybook      # Build static Storybook
```

### Database
After any schema changes in Supabase, always regenerate types:
```bash
pnpm gen:types
```

Migration files live in `supabase/migrations/` and follow the format: `YYYYMMDDHHmmss_description.sql`

## Architecture

### Data Flow Pattern

UntitledOne follows a **server-first architecture** with clear separation of concerns:

1. **Server Components (RSC)** in `src/app/` fetch data directly via Supabase or call functions from `src/lib/api/`
2. **Client components** use TanStack Query hooks defined in `src/lib/api/queries.ts`
3. **API layer** (`src/lib/api/*.ts`) contains all data fetching/mutation logic with proper types
4. **Supabase clients** are created via helpers in `src/lib/supabase/`:
   - `server.ts` for Server Components and API routes
   - `client.ts` for client-side operations
   - `service.ts` for admin operations (uses service role key)

### Authentication & Middleware

Authentication flow is managed by `src/middleware.ts`:
- Checks user session on every request
- Redirects unauthenticated users to `/auth/login` (except public routes)
- Redirects authenticated users away from `/auth` pages to `/dashboard`
- Public routes are explicitly defined (landing page, profile pages, OAuth callbacks)

### Component Architecture (Atomic Design)

Components follow Atomic Design principles with strict responsibilities:

- **Atoms** (`src/components/atoms/`): Pure presentational, no data fetching, only UI state (hover, focus)
- **Molecules** (`src/components/molecules/`): Compose atoms, minimal internal state, no I/O
- **Organisms** (`src/components/organisms/`): Orchestrate molecules, handle page-specific logic, follow server-first approach
- **Templates** (`src/components/templates/`): Layout-only components, including email templates for Resend
- **UI** (`src/components/ui/`): shadcn/ui components from Radix

Split files exceeding 200 lines for maintainability.

### State Management

- **Server state**: TanStack Query via hooks in `src/lib/api/queries.ts`
- **Form state**: React Hook Form + Zod validation
- **UI state**: Local component state or custom hooks from `src/hooks/`
- **Query key pattern**: `["entity", id, "sub-entity", filters]`
  - Example: `["project", projectId, "comments", { activityChangeId }]`

### Internationalization (i18n)

All user-facing text must use `next-intl`:
```typescript
import { useTranslations } from 'next-intl';

const _t = useTranslations('scope.section');
t('key'); // Never hardcode UI strings
```

Translation files: `src/i18n/messages/en.json`, `src/i18n/messages/nl.json`
Structure keys hierarchically: `scope.section.key`

### Database & Row Level Security (RLS)

- All tables MUST have RLS enabled
- RLS policies are granular: one per operation (select/insert/update/delete) per role (authenticated/anon)
- Use `(select auth.uid())` for better query planning
- Migrations are idempotent using `if not exists`/`if exists`
- Always include a "Down" comment section for manual rollback notes

Example RLS pattern:
```sql
create policy "owners can select projects"
on public.projects
for select
to authenticated
using ( (select auth.uid()) = owner_id );
```

### Environment Variables

Centralized in `src/lib/env.ts` with runtime validation:
- Only `NEXT_PUBLIC_*` variables are exposed to client
- Server-only secrets: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, storage OAuth keys
- Use `env()` function to access validated environment variables

## Critical Patterns

### TanStack Query Mutations with Optimistic Updates

Many mutations implement optimistic updates for better UX. Pattern:
```typescript
useMutation({
  mutationFn: (input) => apiCall(input),
  onMutate: async (input) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey });
    // Snapshot previous value
    const _previous = queryClient.getQueryData(queryKey);
    // Optimistically update cache
    queryClient.setQueryData(queryKey, optimisticData);
    return { previous };
  },
  onError: (error, vars, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(queryKey, context.previous);
    }
  },
  onSuccess: () => {
    // Invalidate to refetch fresh data
    queryClient.invalidateQueries({ queryKey });
  },
});
```

### File Upload Pattern

File uploads (audio, avatars) use Supabase Storage with:
- Size limits enforced: `MAX_UPLOAD_FILE_MB` (default 200MB)
- User storage quota: `MAX_USER_STORAGE_MB` (default 50MB)
- Storage helpers in `src/lib/supabase/storage.ts`
- External storage integrations: Dropbox and Google Drive OAuth flows

### Project Collaboration Features

Key collaboration features implemented:
- **Invitations**: Email-based with token-secured acceptance flow
- **Mentions**: `@username` autocomplete in comments via `/api/projects/[id]/members/autocomplete`
- **Share Links**: Token-based public/private project sharing
- **Notifications**: Real-time activity feed with read/unread tracking
- **Comments**: Threaded, timestamped (on waveforms), with resolved/unresolved state
- **Versions**: Track project iterations with activity timeline

### Styling Conventions

- Use Tailwind utility classes (NO `@apply` directives)
- Component variants via `class-variance-authority`
- Merge classes with `cn()` utility from `src/lib/utils.ts`
- Dark mode support via `next-themes`

## Development Guidelines

### Server-First Approach
- Prefer Server Components (RSC) over Client Components
- Only add `"use client"` when necessary (interactivity, hooks, browser APIs)
- Data fetching in RSC should be direct Supabase queries or `src/lib/api/` functions
- Use Suspense boundaries and loading states for async operations

### Type Safety
- Never use `any` in database calls
- Always regenerate types after schema changes: `pnpm gen:types`
- Database types are auto-generated in `src/types/database.ts` - NEVER edit manually

### Caching & Revalidation
- Explicitly set cache behavior: `export const _dynamic = "force-dynamic"` or `revalidate = N`
- Configure query `staleTime` appropriately for different data freshness requirements
- Use `refetchOnMount` and `refetchOnWindowFocus` strategically

### Forms & Validation
- Use React Hook Form with Zod schemas via `@hookform/resolvers/zod`
- Validate at the edges: client-side UX + server-side enforcement
- Display inline errors with aria-* attributes and `FormMessage` components

### Error Handling
- Implement error, loading, and empty states for all routes
- Use guard clauses and provide clear user-facing error messages
- Toast notifications for mutation feedback (success/error)

### SQL Style Guide
- All keywords and identifiers in lowercase
- Use snake_case for tables/columns (tables plural, columns singular)
- Always specify schema explicitly: `public.table_name`
- ISO timestamps with `timestamptz`
- Use CTEs for complex queries (readability over micro-optimization)

## Key Files to Know

- `src/middleware.ts` - Authentication and route protection
- `src/lib/env.ts` - Environment variable management
- `src/lib/api/queries.ts` - All TanStack Query hooks
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/types/database.ts` - Auto-generated DB types (DO NOT EDIT)
- `supabase/seed.sql` - Database seed data for development

## Cursor Rules

This project uses contextual Cursor rules in `.cursor/rules/` that auto-attach to relevant file patterns:
- `ui-atomic.mdc` - Component structure guidelines
- `routing-and-data.mdc` - App Router and data fetching patterns
- `supabase-client.mdc` - Supabase usage best practices
- `create-migration.mdc` - Database migration conventions
- `forms-and-validation.mdc` - Form handling patterns
- `i18n.mdc` - Internationalization requirements

These rules enforce project conventions automatically based on file location.

# AI Dev Tasks
Use these files when I request structured feature development using PRDs:
/ai-dev-tasks/create-prd.md
/ai-dev-tasks/generate-tasks.md
/ai-dev-tasks/process-task-list.md