# Auth Migration to API Routes

## Overview

This project has been migrated from direct Supabase client calls to API routes to resolve CORS issues in production. This approach eliminates cross-origin problems by proxying all authentication requests through Next.js API routes.

## What Changed

### Before (Direct Supabase Client)
```typescript
// Frontend directly calling Supabase
const { error } = await supabaseClient.auth.signInWithPassword({
  email,
  password,
});
```

### After (API Route Proxy)
```typescript
// Frontend calling our API route
const result = await authApi.signIn(email, password);
```

## New API Routes

### `/api/auth/signup`
- **Method**: POST
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user, session }` or `{ error }`

### `/api/auth/login`
- **Method**: POST
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user, session }` or `{ error }`

### `/api/auth/logout`
- **Method**: POST
- **Body**: None
- **Response**: `{ success }` or `{ error }`

### `/api/auth/user`
- **Method**: GET
- **Response**: `{ user }` or `{ error }`

## New Utilities

### `src/lib/api/auth.ts`
Contains the `authApi` object with methods:
- `signUp(email, password)`
- `signIn(email, password)`
- `signOut()`

### `src/hooks/use-logout.ts`
New hook for handling logout with automatic redirect.

## Updated Components

### Login Page (`src/app/auth/login/page.tsx`)
- Now uses `authApi.signIn()` instead of direct Supabase client
- Simplified auth flow (removed complex code exchange logic)

### Register Page (`src/app/auth/register/page.tsx`)
- Now uses `authApi.signUp()` instead of direct Supabase client

### Current User Hook (`src/hooks/use-current-user.ts`)
- Now fetches user data via `/api/auth/user` endpoint

## Benefits

1. **No CORS Issues**: All requests go through your own domain
2. **Better Error Handling**: Centralized error handling in API routes
3. **Easier Debugging**: Server-side logs for auth operations
4. **Consistent API**: All auth operations use the same pattern

## Limitations

1. **Code Exchange**: Email confirmation flows that require `exchangeCodeForSession` are not fully implemented
2. **Session Management**: Some advanced session management features may need additional implementation

## Environment Variables

Make sure these are set in your production environment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_BASE_KEY=your_service_role_key
```

## Testing

1. Test signup flow
2. Test login flow
3. Test logout flow
4. Test protected routes
5. Test user session persistence

## Deployment

After deploying these changes:

1. Set environment variables in your hosting platform
2. Test all auth flows
3. Monitor for any errors in the console

## Troubleshooting

### Common Issues

1. **401 Errors**: Check if environment variables are set correctly
2. **500 Errors**: Check server logs for Supabase connection issues
3. **Session Not Persisting**: Ensure middleware is working correctly

### Debug Steps

1. Check browser network tab for API calls
2. Check server logs for errors
3. Verify environment variables are loaded
4. Test with a fresh browser session 