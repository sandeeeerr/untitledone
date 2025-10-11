import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import createServerClient from '@/lib/supabase/server';
import { getStorageProvider } from '@/lib/storage/factory';
import { getStorageConnection } from '@/lib/supabase/service';
import { decryptToken } from '@/lib/utils/encryption';
import type { StorageProviderType } from '@/lib/storage/types';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  fileId: z.string().uuid('Invalid file ID'),
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

    // Check project access
    const { data: project } = await (supabase as SupabaseClient)
      .from('projects')
      .select('id, owner_id, is_private, downloads_enabled')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify access permissions
    if (project.is_private && project.owner_id !== user.id) {
      const { data: membership } = await (supabase as SupabaseClient)
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get file details
    const { data: file } = await (supabase as SupabaseClient)
      .from('project_files')
      .select('id, file_path, filename, uploaded_by, file_type, storage_provider, external_file_id')
      .eq('id', validFileId)
      .eq('project_id', projectId)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get storage provider using uploader's credentials (ownership proxying)
    const storageProvider = ((file as any).storage_provider || 'local') as StorageProviderType;
    const uploadedByUserId = file.uploaded_by;
    const fileIdentifier = (file as any).external_file_id || file.file_path;

    // For local storage (Supabase), get signed URL and redirect
    if (storageProvider === 'local') {
      const adapter = await getStorageProvider(storageProvider, uploadedByUserId);
      const signedUrl = await adapter.getDownloadUrl(fileIdentifier, uploadedByUserId, 60 * 60);
      return NextResponse.redirect(signedUrl);
    }

    // For Google Drive, use Drive API to download file content directly
    if (storageProvider === 'google_drive') {
      try {
        const connection = await getStorageConnection(uploadedByUserId, 'google_drive');
        const accessToken = decryptToken(connection.encrypted_access_token);
        
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        console.log('[Content Proxy] Fetching Google Drive file:', fileIdentifier);
        
        // Download file content using Drive API
        const response = await drive.files.get(
          { fileId: fileIdentifier, alt: 'media' },
          { responseType: 'arraybuffer' } // Get as ArrayBuffer for easier handling
        );

        console.log('[Content Proxy] Google Drive file fetched successfully');

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
      } catch (driveError: any) {
        console.error('[Content Proxy] Google Drive error:', driveError);
        
        // Check if it's a 401 (token expired)
        if (driveError?.code === 401) {
          return NextResponse.json(
            { error: 'File owner needs to reconnect their Google Drive account', code: 'PROVIDER_TOKEN_EXPIRED' },
            { status: 401 }
          );
        }
        
        throw driveError;
      }
    }

    // For Dropbox, get signed URL and fetch/stream
    if (storageProvider === 'dropbox') {
      const adapter = await getStorageProvider(storageProvider, uploadedByUserId);
      const signedUrl = await adapter.getDownloadUrl(fileIdentifier, uploadedByUserId, 60 * 60);
      
      const response = await fetch(signedUrl);

      if (!response.ok) {
        console.error('Failed to fetch file from Dropbox:', response.statusText);
        return NextResponse.json(
          { error: 'Failed to fetch file from storage provider' },
          { status: 500 }
        );
      }

      const contentType = file.file_type || 'application/octet-stream';
      
      return new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${file.filename}"`,
          'Cache-Control': 'private, max-age=3600',
          'Accept-Ranges': 'bytes',
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported storage provider' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error streaming file content:', error);

    if (error instanceof Error) {
      if (error.message.includes('PROVIDER_TOKEN_EXPIRED')) {
        return NextResponse.json(
          { error: 'File owner needs to reconnect their storage provider', code: 'PROVIDER_TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      if (error.message.includes('PROVIDER_NOT_CONNECTED')) {
        return NextResponse.json(
          { error: "File owner's storage provider is not connected", code: 'PROVIDER_NOT_CONNECTED' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to stream file content' },
      { status: 500 }
    );
  }
}

