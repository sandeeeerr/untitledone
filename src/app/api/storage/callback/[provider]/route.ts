import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { google } from 'googleapis';
import { env } from '@/lib/env';
import { encryptToken } from '@/lib/utils/encryption';
import { createServiceClient } from '@/lib/supabase/service';

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
 * OAuth Callback Endpoint
 * 
 * Handles the OAuth callback from external storage providers.
 * Exchanges authorization code for access token and stores encrypted tokens.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate and normalize provider
    const { provider: providerRaw } = await params;
    const provider = normalizeProvider(providerRaw);
    
    if (!provider) {
      return errorPage('Invalid provider');
    }

    if (!code || !state) {
      return errorPage('Missing authorization code or state');
    }

    // Validate state token from database
    const serviceClient = createServiceClient();
    const [_stateToken, userId] = state.split('.');
    
    if (!userId) {
      return errorPage('Invalid state format');
    }

    // Verify state token exists in database
    const { data: pendingConnection, error: stateError } = await serviceClient
      .from('storage_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('encrypted_access_token', state)
      .single();

    if (stateError || !pendingConnection) {
      return errorPage('Invalid or expired authorization state');
    }

    // Exchange code for tokens and get user info
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let accountId = '';
    let accountName = '';

    if (provider === 'dropbox') {
      // Dropbox token exchange
      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: env().DROPBOX_APP_KEY,
          client_secret: env().DROPBOX_APP_SECRET,
          redirect_uri: env().DROPBOX_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        return errorPage('Failed to exchange Dropbox authorization code');
      }

      const tokenData = await response.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;
      expiresIn = tokenData.expires_in || null;

      // Fetch account info
      const dbx = new Dropbox({ accessToken, fetch: fetch as typeof globalThis.fetch });
      const accountInfo = await dbx.usersGetCurrentAccount();
      accountId = accountInfo.result.account_id;
      accountName = accountInfo.result.email;
    } else {
      // Google Drive token exchange
      const oauth2Client = new google.auth.OAuth2(
        env().GOOGLE_DRIVE_CLIENT_ID,
        env().GOOGLE_DRIVE_CLIENT_SECRET,
        env().GOOGLE_DRIVE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code);
      accessToken = tokens.access_token!;
      refreshToken = tokens.refresh_token || null;
      expiresIn = tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : null;

      // Fetch user info from Google
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          accountId = userInfo.id || '';
          accountName = userInfo.email || '';
        } else {
          // Fallback: extract from token info
          const tokenInfoResponse = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
          );
          if (tokenInfoResponse.ok) {
            const tokenInfo = await tokenInfoResponse.json();
            accountId = tokenInfo.sub || '';
            accountName = tokenInfo.email || '';
          }
        }
      } catch (error) {
        console.error('Failed to fetch Google user info:', error);
        accountId = 'unknown';
        accountName = 'Google Drive User';
      }
    }

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;
    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString() 
      : null;

    // Update connection in database
    const { error: upsertError } = await serviceClient
      .from('storage_connections')
      .update({
        provider_account_id: accountId,
        provider_account_name: accountName,
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        encryption_key_version: env().STORAGE_TOKEN_ENCRYPTION_CURRENT_VERSION,
        token_expires_at: tokenExpiresAt,
        status: 'active',
        connected_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (upsertError) {
      console.error('Failed to save storage connection:', upsertError);
      return errorPage('Failed to save storage connection');
    }

    // Success! Redirect back to settings
    return successPage(provider);

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return errorPage('An unexpected error occurred');
  }
}

/**
 * Redirects immediately to settings page with success parameter for toast notification
 */
function successPage(provider: string) {
  const redirectUrl = `/settings/storage?connected=${encodeURIComponent(provider)}`;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
  <p>Connection successful! Redirecting...</p>
  <script>window.location.href = '${redirectUrl}';</script>
</body>
</html>`;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Redirects to settings page with error parameter
 */
function errorPage(message: string) {
  const redirectUrl = `/settings/storage?error=${encodeURIComponent(message)}`;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
  <p>Redirecting back to settings...</p>
  <script>window.location.href = '${redirectUrl}';</script>
</body>
</html>`;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 400,
  });
}
