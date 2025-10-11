import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import createServerClient from '@/lib/supabase/server';
import { env } from '@/lib/env';

type Provider = 'dropbox' | 'google_drive';

/**
 * Normalize provider slug from URL (google-drive) to internal format (google_drive)
 */
function normalizeProvider(slug: string): Provider | null {
  const normalized = slug.replace(/-/g, '_');
  if (normalized === 'dropbox' || normalized === 'google_drive') {
    return normalized as Provider;
  }
  return null;
}

/**
 * OAuth Connect Endpoint
 * 
 * Initiates the OAuth flow for external storage providers.
 * Opens in popup window and redirects to provider's authorization URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate and normalize provider parameter
    const { provider: providerRaw } = await params;
    const provider = normalizeProvider(providerRaw);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "dropbox" or "google-drive"' },
        { status: 400 }
      );
    }

    // Generate cryptographically secure state token
    // Includes random string + user ID for CSRF protection
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const state = `${randomBytes}.${user.id}`;

    // Store state token in database (expires in 10 minutes)
    // Using service client since we're storing session data server-side
    const { createServiceClient } = await import('@/lib/supabase/service');
    const serviceClient = createServiceClient();
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store state token in database for validation during callback
    const { error: upsertError } = await serviceClient
      .from('storage_connections')
      .upsert({
        user_id: user.id,
        provider,
        provider_account_id: `pending_${state}`,
        provider_account_name: 'Pending OAuth',
        encrypted_access_token: state,
        encrypted_refresh_token: null,
        encryption_key_version: 'pending',
        token_expires_at: expiresAt.toISOString(),
        status: 'error',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('[OAuth Connect] Failed to store state token:', upsertError);
      return NextResponse.json(
        { error: 'Failed to initialize OAuth flow' },
        { status: 500 }
      );
    }

    // Construct OAuth authorization URL based on provider
    let authUrl: string;

    if (provider === 'dropbox') {
      const clientId = env().DROPBOX_APP_KEY;
      const redirectUri = env().DROPBOX_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        console.error('[OAuth Connect] Missing Dropbox OAuth configuration');
        return NextResponse.json(
          { error: 'Dropbox OAuth configuration missing' },
          { status: 500 }
        );
      }

      authUrl = `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&token_access_type=offline` + // Request refresh token
        `&state=${encodeURIComponent(state)}`;
    } else {
      // Google Drive
      const clientId = env().GOOGLE_DRIVE_CLIENT_ID;
      const redirectUri = env().GOOGLE_DRIVE_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        console.error('[OAuth Connect] Missing Google Drive OAuth configuration');
        return NextResponse.json(
          { error: 'Google Drive OAuth configuration missing' },
          { status: 500 }
        );
      }

      // Request both drive.file and email scopes
      const scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');
      
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&access_type=offline` + // Request refresh token
        `&prompt=consent` + // Force consent screen to get refresh token
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${encodeURIComponent(state)}`;
    }

    // Redirect to provider's OAuth authorization URL
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('[OAuth Connect] Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

