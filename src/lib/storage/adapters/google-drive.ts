import { google } from 'googleapis';
import type { StorageProvider, StorageUploadResult } from '../types';
import { getStorageConnection, updateStorageConnection } from '../../supabase/service';
import { decryptToken, encryptToken } from '../../utils/encryption';
import { env } from '../../env';
import { Readable } from 'stream';
import { StorageProviderError, STORAGE_ERROR_CODES } from '../../errors/storage-errors';

/**
 * Google Drive Storage Adapter
 * 
 * Implements the StorageProvider interface for Google Drive.
 * Handles file uploads, downloads, and deletions using Google Drive API v3.
 * Implements lazy 401 retry pattern for automatic token refresh.
 */
export class GoogleDriveAdapter implements StorageProvider {
  readonly name = 'google_drive' as const;

  /**
   * Upload a file to Google Drive.
   * Implements lazy 401 retry pattern - automatically refreshes tokens on expiration.
   */
  async upload(file: File, path: string, userId: string): Promise<StorageUploadResult> {
    try {
      return await this.uploadInternal(file, path, userId);
    } catch (error) {
      // Check if it's a 401 (unauthorized/expired token)
      if (this.is401Error(error)) {
        console.warn(`Google Drive token expired for user ${userId}, attempting refresh...`);
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          throw new StorageProviderError(
          STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED,
          'Google Drive token expired and refresh failed',
          { provider: 'google_drive' }
        );
        }
        
        // Retry upload once with fresh token
        return await this.uploadInternal(file, path, userId);
      }
      throw error;
    }
  }

  /**
   * Internal upload implementation (no retry logic).
   */
  private async uploadInternal(
    file: File,
    path: string,
    userId: string
  ): Promise<StorageUploadResult> {
    const connection = await getStorageConnection(userId, 'google_drive');
    const accessToken = decryptToken(connection.encrypted_access_token);
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get or create UntitledOne app folder
    const folderId = await this.getOrCreateAppFolder(drive);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create readable stream from buffer
    const stream = Readable.from(buffer);

    // Upload file to Drive
    const result = await drive.files.create({
      requestBody: {
        name: path.split('/').pop() || file.name, // Use filename from path
        parents: [folderId],
        mimeType: file.type || 'application/octet-stream',
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, name, size, mimeType, createdTime, md5Checksum',
    });

    // Update last_used_at timestamp
    await updateStorageConnection(userId, 'google_drive', {
      last_used_at: new Date().toISOString(),
    });

    return {
      fileId: result.data.id || '',
      path: result.data.name || path,
      size: parseInt(result.data.size || '0', 10),
      metadata: {
        mimeType: result.data.mimeType,
        createdTime: result.data.createdTime,
        md5Checksum: result.data.md5Checksum,
      },
    };
  }

  /**
   * Generate a temporary download URL for a Google Drive file.
   * Implements lazy 401 retry pattern.
   */
  async getDownloadUrl(
    fileId: string,
    userId: string,
    _expiresIn: number = 600
  ): Promise<string> {
    try {
      return await this.getDownloadUrlInternal(fileId, userId);
    } catch (error) {
      if (this.is401Error(error)) {
        console.warn(`Google Drive token expired for user ${userId}, attempting refresh...`);
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          throw new StorageProviderError(
          STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED,
          'Google Drive token expired and refresh failed',
          { provider: 'google_drive' }
        );
        }
        
        // Retry once with fresh token
        return await this.getDownloadUrlInternal(fileId, userId);
      }
      throw error;
    }
  }

  /**
   * Internal download URL generation (no retry logic).
   * 
   * For Google Drive, returns just the file ID.
   * The content proxy endpoint will handle fetching via Drive API.
   */
  private async getDownloadUrlInternal(
    fileId: string,
    userId: string
  ): Promise<string> {
    // Update last_used_at timestamp
    await updateStorageConnection(userId, 'google_drive', {
      last_used_at: new Date().toISOString(),
    });

    // Return the file ID - content proxy will handle the actual fetch
    return fileId;
  }

  /**
   * Delete a file from Google Drive.
   * Implements lazy 401 retry pattern.
   */
  async delete(fileId: string, userId: string): Promise<void> {
    try {
      await this.deleteInternal(fileId, userId);
    } catch (error) {
      if (this.is401Error(error)) {
        console.warn(`Google Drive token expired for user ${userId}, attempting refresh...`);
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          throw new StorageProviderError(
          STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED,
          'Google Drive token expired and refresh failed',
          { provider: 'google_drive' }
        );
        }
        
        // Retry once with fresh token
        await this.deleteInternal(fileId, userId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Internal delete implementation (no retry logic).
   */
  private async deleteInternal(fileId: string, userId: string): Promise<void> {
    const connection = await getStorageConnection(userId, 'google_drive');
    const accessToken = decryptToken(connection.encrypted_access_token);
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    await drive.files.delete({ fileId });

    // Update last_used_at timestamp
    await updateStorageConnection(userId, 'google_drive', {
      last_used_at: new Date().toISOString(),
    });
  }

  /**
   * Validate that the user has an active Google Drive connection.
   */
  async validateConnection(userId: string): Promise<boolean> {
    try {
      const connection = await getStorageConnection(userId, 'google_drive');
      return connection.status === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Refresh Google Drive access token using refresh token.
   * Updates the stored connection with new token and status.
   */
  async refreshTokens(userId: string): Promise<boolean> {
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
   * Helper to detect 401 errors from Google Drive API.
   */
  private is401Error(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 401
    );
  }

  /**
   * Get or create the UntitledOne app folder in Google Drive.
   * Returns the folder ID.
   */
  private async getOrCreateAppFolder(drive: ReturnType<typeof google.drive>): Promise<string> {
    // Search for existing UntitledOne folder
    const searchResult = await drive.files.list({
      q: "name='UntitledOne' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (searchResult.data.files && searchResult.data.files.length > 0) {
      const folderId = searchResult.data.files[0].id;
      if (!folderId) {
        throw new Error('Failed to get folder ID from Google Drive');
      }
      return folderId;
    }

    // Create folder if it doesn't exist
    const createResult = await drive.files.create({
      requestBody: {
        name: 'UntitledOne',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    const folderId = createResult.data.id;
    if (!folderId) {
      throw new Error('Failed to create folder in Google Drive');
    }
    return folderId;
  }
}

