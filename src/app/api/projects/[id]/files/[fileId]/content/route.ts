import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import createServerClient from '@/lib/supabase/server';
import { getStorageProvider } from '@/lib/storage/factory';
import { getStorageConnection, updateStorageConnection } from '@/lib/supabase/service';
import { decryptToken, encryptToken } from '@/lib/utils/encryption';
import { env } from '@/lib/env';
import type { StorageProviderType } from '@/lib/storage/types';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  fileId: z.string().min(1, 'Invalid file ID'), // Support both UUIDs and external IDs (Google Drive, Dropbox)
});

/**
 * File Content Proxy Endpoint
 * 
 * GET: Streams file content from storage provider (handles CORS for external providers)
 * This is needed because external provider URLs (especially Google Drive) have CORS restrictions
 * that prevent direct browser access for media playback.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, fileId } = await params;
    const validation = paramsSchema.safeParse({ id, fileId });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { id: projectId, fileId: validFileId } = validation.data;

    // Get file details from database
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select(`
        id,
        filename,
        file_type,
        file_size,
        storage_provider,
        uploaded_by,
        external_file_id
      `)
      .eq('id', validFileId)
      .eq('project_id', projectId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const storageProvider = file.storage_provider as StorageProviderType;
    const uploadedByUserId = file.uploaded_by;
    const fileIdentifier = file.external_file_id || file.id;

    // For local storage, redirect to Supabase Storage URL
    if (storageProvider === 'local') {
      const { data: signedUrl } = await supabase.storage
        .from('project-files')
        .createSignedUrl(fileIdentifier, 60 * 60); // 1 hour expiry

      if (!signedUrl) {
        return NextResponse.json(
          { error: 'Failed to generate signed URL' },
          { status: 500 }
        );
      }

      return NextResponse.redirect(signedUrl.signedUrl);
    }

    // For Dropbox, get signed URL and redirect
    if (storageProvider === 'dropbox') {
      const adapter = await getStorageProvider(storageProvider, uploadedByUserId);
      const signedUrl = await adapter.getDownloadUrl(fileIdentifier, uploadedByUserId, 60 * 60);
      return NextResponse.redirect(signedUrl);
    }

    // For Google Drive, handle token refresh automatically
    if (storageProvider === 'google_drive') {
      try {
        return await fetchGoogleDriveFile(fileIdentifier, uploadedByUserId, file);
      } catch (error) {
        // Check if it's a 401 (unauthorized/expired token)
        if (is401Error(error)) {
          console.warn(`Google Drive token expired for user ${uploadedByUserId}, attempting refresh...`);
          const refreshed = await refreshGoogleDriveTokens(uploadedByUserId);
          
          if (!refreshed) {
            return NextResponse.json(
              { error: 'File owner needs to reconnect their Google Drive account', code: 'PROVIDER_TOKEN_EXPIRED' },
              { status: 401 }
            );
          }
          
          // Retry fetch once with fresh token
          return await fetchGoogleDriveFile(fileIdentifier, uploadedByUserId, file);
        }
        throw error;
      }
    }

    return NextResponse.json(
      { error: 'Failed to stream file content' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in file content proxy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file content' },
      { status: 500 }
    );
  }
}

/**
 * Fetch Google Drive file content using current access token
 */
async function fetchGoogleDriveFile(fileIdentifier: string, userId: string, file: any): Promise<NextResponse> {
  const connection = await getStorageConnection(userId, 'google_drive');
  const accessToken = decryptToken(connection.encrypted_access_token);
  
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  console.warn('[Content Proxy] Fetching Google Drive file:', fileIdentifier);
  
  // Download file content using Drive API
  const response = await drive.files.get(
    { fileId: fileIdentifier, alt: 'media' },
    { responseType: 'arraybuffer' } // Get as ArrayBuffer for easier handling
  );

  console.warn('[Content Proxy] Google Drive file fetched successfully');

  // Convert to buffer
  const buffer = Buffer.from(response.data as ArrayBuffer);
  const contentType = file.file_type || 'application/octet-stream';
  
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
      'Accept-Ranges': 'bytes',
    },
  });
}

/**
 * Refresh Google Drive access token using refresh token
 */
async function refreshGoogleDriveTokens(userId: string): Promise<boolean> {
  try {
    const connection = await getStorageConnection(userId, 'google_drive');
    
    if (!connection.encrypted_refresh_token) {
      console.error('No refresh token available for Google Drive connection');
      return false;
    }

    const refreshToken = decryptToken(connection.encrypted_refresh_token);
    const clientId = env().GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = env().GOOGLE_DRIVE_CLIENT_SECRET;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      console.error('No access token in refreshed credentials');
      await updateStorageConnection(userId, 'google_drive', {
        status: 'expired',
      });
      return false;
    }

    const newAccessToken = encryptToken(credentials.access_token);
    const tokenExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : null;

    // Update connection with new token
    await updateStorageConnection(userId, 'google_drive', {
      encrypted_access_token: newAccessToken,
      token_expires_at: tokenExpiresAt,
      status: 'active',
      last_used_at: new Date().toISOString(),
    });

    console.warn(`✓ Google Drive token refreshed successfully for user ${userId}`);
    return true;

  } catch (error) {
    console.error('Error refreshing Google Drive token:', error);
    
    // Update status to error
    await updateStorageConnection(userId, 'google_drive', {
      status: 'error',
    }).catch(() => {});
    
    return false;
  }
}

/**
 * Helper to detect 401 errors from Google Drive API
 */
function is401Error(error: unknown): boolean {
  return error && typeof error === 'object' && 'code' in error && error.code === 401;
}