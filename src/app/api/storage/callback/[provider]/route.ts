import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { google } from 'googleapis';
import createServerClient from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { encryptToken } from '@/lib/utils/encryption';
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
 * OAuth Callback Endpoint
 * 
 * Handles the OAuth callback from external storage providers.
 * Exchanges authorization code for tokens, encrypts them, and stores the connection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Get and normalize provider parameter
    const { provider: providerRaw } = await params;
    const provider = normalizeProvider(providerRaw);
    
    if (!provider) {
      return errorPage('Invalid provider');
    }

    // Get code and state from query parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('[OAuth Callback] Provider:', provider);
    console.log('[OAuth Callback] Code present:', !!code);
    console.log('[OAuth Callback] State present:', !!state);

    // Handle user denial or error from provider
    if (error) {
      console.error('[OAuth Callback] Provider returned error:', error);
      return errorPage(`Authorization failed: ${error}`);
    }

    if (!code || !state) {
      console.error('[OAuth Callback] Missing code or state. Code:', !!code, 'State:', !!state);
      return errorPage('Missing authorization code or state');
    }

    // Extract user ID from state (format: randomBytes.userId)
    const userId = state.split('.')[1];
    console.log('[OAuth Callback] User ID from state:', userId);
    
    if (!userId) {
      console.error('[OAuth Callback] Invalid state format, no user ID found');
      return errorPage('Invalid state format');
    }

    // Validate state token against database (CSRF protection)
    // NOTE: We don't use supabase.auth.getUser() here because the popup window
    // doesn't have the user's session cookies. Instead, we trust the state token
    // validation which cryptographically proves the user initiated this flow.
    const serviceClient = createServiceClient();
    const { data: pendingConnection } = await serviceClient
      .from('storage_connections')
      .select('encrypted_access_token, encryption_key_version')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('encryption_key_version', 'pending')
      .single();
    
    console.log('[OAuth Callback] Pending connection found:', !!pendingConnection);
    console.log('[OAuth Callback] Stored state matches:', pendingConnection?.encrypted_access_token === state);
    
    if (!pendingConnection || pendingConnection.encrypted_access_token !== state) {
      console.error('[OAuth Callback] State validation failed. Pending:', !!pendingConnection, 'Match:', pendingConnection?.encrypted_access_token === state);
      return errorPage('Invalid or expired state token. Please try connecting again.');
    }

    console.log('[OAuth Callback] Starting token exchange for', provider);

    // Exchange authorization code for tokens based on provider
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let accountId: string;
    let accountName: string;

    if (provider === 'dropbox') {
      const clientId = env().DROPBOX_APP_KEY;
      const clientSecret = env().DROPBOX_APP_SECRET;
      const redirectUri = env().DROPBOX_REDIRECT_URI;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Dropbox token exchange failed:', errorData);
        return errorPage('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token;
      expiresIn = tokens.expires_in;

      // Fetch account info
      // Dropbox SDK needs fetch implementation in server-side Node.js
      const dbx = new Dropbox({ 
        accessToken,
        fetch: fetch as any, // Provide global fetch to SDK
      });
      const accountInfo = await dbx.usersGetCurrentAccount();
      accountId = accountInfo.result.account_id;
      accountName = accountInfo.result.email;

    } else {
      // Google Drive
      const clientId = env().GOOGLE_DRIVE_CLIENT_ID;
      const clientSecret = env().GOOGLE_DRIVE_CLIENT_SECRET;
      const redirectUri = env().GOOGLE_DRIVE_REDIRECT_URI;

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      console.log('[OAuth Callback] Exchanging code for tokens...');
      
      // Exchange code for tokens
      let tokens;
      try {
        const result = await oauth2Client.getToken(code);
        tokens = result.tokens;
        console.log('[OAuth Callback] Token exchange successful');
      } catch (tokenError) {
        console.error('[OAuth Callback] Token exchange failed:', tokenError);
        return errorPage('Failed to exchange authorization code with Google');
      }
      
      console.log('[OAuth Callback] Token exchange response - has access token:', !!tokens.access_token);
      console.log('[OAuth Callback] Token exchange response - has refresh token:', !!tokens.refresh_token);
      
      if (!tokens.access_token) {
        return errorPage('Failed to get access token from Google');
      }

      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || null;
      expiresIn = tokens.expiry_date 
        ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
        : null;

      // Fetch account info using Google's userinfo endpoint
      // Now that we have email scope, this will work
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        console.error('Failed to fetch Google user info:', await userInfoResponse.text());
        // Fallback: try tokeninfo endpoint
        const tokenInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
        );
        if (tokenInfoResponse.ok) {
          const tokenInfo = await tokenInfoResponse.json();
          accountId = tokenInfo.sub || '';
          accountName = tokenInfo.email || 'Google Drive User';
          console.log('[OAuth Callback] Used tokeninfo fallback - has email:', !!accountName);
        } else {
          return errorPage('Failed to retrieve account information');
        }
      } else {
        const userInfo = await userInfoResponse.json();
        console.log('[OAuth Callback] User info received - has email:', !!userInfo.email);
        
        accountId = userInfo.id || '';
        accountName = userInfo.email || '';
      }
    }

    console.log('[OAuth Callback] Account info retrieved - ID:', !!accountId, 'Name:', !!accountName);

    // Encrypt tokens
    console.log('[OAuth Callback] Encrypting tokens...');
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;
    console.log('[OAuth Callback] Tokens encrypted successfully');

    // Calculate token expiration timestamp
    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    console.log('[OAuth Callback] Saving connection to database...');
    
    // Store connection in database using service role client (reuse from validation above)
    const { error: upsertError } = await serviceClient
      .from('storage_connections')
      .upsert({
        user_id: userId,
        provider,
        provider_account_id: accountId,
        provider_account_name: accountName,
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        encryption_key_version: 'v1',
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (upsertError) {
      console.error('[OAuth Callback] Failed to store connection:', upsertError);
      return errorPage('Failed to save connection');
    }

    console.log('[OAuth Callback] ✓ Connection saved successfully for', provider);

    // Return success page that posts message to opener and closes popup
    return successPage(provider);

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return errorPage('An unexpected error occurred');
  }
}

/**
 * Renders a success page that notifies the opener window and closes the popup
 */
function successPage(provider: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connection Successful</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .success {
          color: #10b981;
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #111;
          margin: 0 0 0.5rem 0;
        }
        p {
          color: #666;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✓</div>
        <h1>Connected Successfully</h1>
        <p>Your ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'} account has been connected.</p>
        <p>This window will close automatically...</p>
      </div>
      <script>
        // Notify opener window
        if (window.opener) {
          window.opener.postMessage({
            type: 'storage-connection-success',
            provider: '${provider}'
          }, '*');
        }
        // Close popup after brief delay
        setTimeout(() => window.close(), 1500);
      </script>
    </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Renders an error page with a close button
 */
function errorPage(message: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connection Failed</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 400px;
        }
        .error {
          color: #ef4444;
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #111;
          margin: 0 0 0.5rem 0;
        }
        p {
          color: #666;
          margin: 0 0 1.5rem 0;
        }
        button {
          background: #111;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error">✗</div>
        <h1>Connection Failed</h1>
        <p>${message}</p>
        <button onclick="window.close()">Close Window</button>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 400,
  });
}

