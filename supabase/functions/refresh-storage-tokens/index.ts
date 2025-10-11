import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@134';

// Note: Encryption utilities would need to be copied/adapted for Deno
// For now, this is a simplified version that shows the structure

/**
 * Background Token Refresh Edge Function
 * 
 * Runs every 30 minutes via cron to proactively refresh storage provider tokens
 * that are expiring within the next hour.
 * 
 * This ensures tokens stay fresh and prevents user-facing 401 errors.
 */

Deno.serve(async (req) => {
  try {
    const startTime = Date.now();
    console.log('[Token Refresh] Starting token refresh job...');

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Query connections that are expiring within the next hour
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: expiringConnections, error: queryError } = await supabase
      .from('storage_connections')
      .select('*')
      .eq('status', 'active')
      .lt('token_expires_at', oneHourFromNow)
      .not('token_expires_at', 'is', null);

    if (queryError) {
      console.error('[Token Refresh] Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query connections', details: queryError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stats = {
      total: expiringConnections?.length || 0,
      refreshed: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; provider: string; error: string }>,
    };

    console.log(`[Token Refresh] Found ${stats.total} connections expiring soon`);

    // Process each expiring connection
    for (const conn of expiringConnections || []) {
      try {
        console.log(`[Token Refresh] Processing ${conn.provider} for user ${conn.user_id}`);

        let newAccessToken: string;
        let expiresIn: number | null = null;

        // Decrypt refresh token (simplified - would use actual encryption in production)
        const refreshToken = decryptToken(conn.encrypted_refresh_token);

        if (conn.provider === 'dropbox') {
          // Refresh Dropbox token
          const response = await fetch('https://api.dropbox.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: Deno.env.get('DROPBOX_APP_KEY')!,
              client_secret: Deno.env.get('DROPBOX_APP_SECRET')!,
            }),
          });

          if (!response.ok) {
            throw new Error(`Dropbox refresh failed: ${response.statusText}`);
          }

          const tokens = await response.json();
          newAccessToken = tokens.access_token;
          expiresIn = tokens.expires_in;

        } else if (conn.provider === 'google_drive') {
          // Refresh Google Drive token
          const oauth2Client = new google.auth.OAuth2(
            Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')!,
            Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')!
          );

          oauth2Client.setCredentials({ refresh_token: refreshToken });
          const { credentials } = await oauth2Client.refreshAccessToken();

          if (!credentials.access_token) {
            throw new Error('No access token in refreshed credentials');
          }

          newAccessToken = credentials.access_token;
          expiresIn = credentials.expiry_date 
            ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
            : null;

        } else {
          throw new Error(`Unknown provider: ${conn.provider}`);
        }

        // Encrypt new access token (simplified - would use actual encryption)
        const encryptedAccessToken = encryptToken(newAccessToken);

        // Calculate new expiration
        const tokenExpiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null;

        // Update connection in database
        const { error: updateError } = await supabase
          .from('storage_connections')
          .update({
            encrypted_access_token: encryptedAccessToken,
            token_expires_at: tokenExpiresAt,
            status: 'active',
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conn.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        stats.refreshed++;
        console.log(`✓ Refreshed ${conn.provider} token for user ${conn.user_id}`);

      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push({
          userId: conn.user_id,
          provider: conn.provider,
          error: errorMessage,
        });

        console.error(`✗ Failed to refresh ${conn.provider} for user ${conn.user_id}:`, errorMessage);

        // Update status to expired
        await supabase
          .from('storage_connections')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', conn.id);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Token Refresh] Completed in ${duration}ms. Refreshed: ${stats.refreshed}, Failed: ${stats.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        duration,
        ...stats,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Token Refresh] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Simplified encryption functions for Deno (would need full implementation)
function encryptToken(token: string): string {
  // TODO: Implement AES-256-GCM encryption for Deno
  // For now, return a placeholder that indicates this needs proper implementation
  return `encrypted:${token}`;
}

function decryptToken(encrypted: string): string {
  // TODO: Implement AES-256-GCM decryption for Deno
  // For now, return a placeholder
  return encrypted.replace('encrypted:', '');
}

/* 
IMPORTANT NOTES FOR PRODUCTION:
1. This Edge Function needs proper encryption/decryption utilities adapted for Deno
2. The encryption should match the Node.js implementation in src/lib/utils/encryption.ts
3. Consider extracting encryption to a shared module or using Web Crypto API
4. Ensure all environment variables are set in Supabase Edge Function settings
5. Monitor logs and set up alerts for failed refreshes
*/

