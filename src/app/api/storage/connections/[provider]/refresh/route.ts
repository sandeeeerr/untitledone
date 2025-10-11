import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import createServerClient from '@/lib/supabase/server';
import { getStorageConnection, updateStorageConnection } from '@/lib/supabase/service';
import { decryptToken, encryptToken } from '@/lib/utils/encryption';
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
 * Manual Token Refresh Endpoint
 * 
 * POST: Manually triggers token refresh for a storage provider
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    // Authenticate user
    const supabase = await createServerClient();
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

    // Get the storage connection using service client
    const connection = await getStorageConnection(user.id, provider);

    if (!connection.encrypted_refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available for this connection' },
        { status: 400 }
      );
    }

    // Decrypt the refresh token
    const refreshToken = decryptToken(connection.encrypted_refresh_token);

    // Refresh tokens based on provider
    let newAccessToken: string;
    let expiresIn: number | null = null;

    if (provider === 'dropbox') {
      const clientId = env().DROPBOX_APP_KEY;
      const clientSecret = env().DROPBOX_APP_SECRET;

      // Call Dropbox token refresh endpoint
      const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Dropbox token refresh failed:', errorData);
        
        // Update status to expired
        await updateStorageConnection(user.id, provider, {
          status: 'expired',
        });

        return NextResponse.json(
          { error: 'Token refresh failed', status: 'expired' },
          { status: 400 }
        );
      }

      const tokens = await response.json();
      newAccessToken = tokens.access_token;
      expiresIn = tokens.expires_in;

    } else {
      // Google Drive
      const clientId = env().GOOGLE_DRIVE_CLIENT_ID;
      const clientSecret = env().GOOGLE_DRIVE_CLIENT_SECRET;

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      try {
        // Refresh the access token
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (!credentials.access_token) {
          throw new Error('No access token in refreshed credentials');
        }

        newAccessToken = credentials.access_token;
        expiresIn = credentials.expiry_date 
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : null;

      } catch (error) {
        console.error('Google Drive token refresh failed:', error);
        
        // Update status to expired
        await updateStorageConnection(user.id, provider, {
          status: 'expired',
        });

        return NextResponse.json(
          { error: 'Token refresh failed', status: 'expired' },
          { status: 400 }
        );
      }
    }

    // Encrypt the new access token
    const encryptedAccessToken = encryptToken(newAccessToken);

    // Calculate new token expiration
    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Update the connection with new token and status
    await updateStorageConnection(user.id, provider, {
      encrypted_access_token: encryptedAccessToken,
      token_expires_at: tokenExpiresAt,
      status: 'active',
      last_used_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        success: true, 
        provider,
        status: 'active',
        expiresAt: tokenExpiresAt || null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error refreshing storage token:', error);
    
    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes('No storage connection found')) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

