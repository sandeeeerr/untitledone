import { Dropbox } from 'dropbox';
import type { StorageProvider, StorageUploadResult } from '../types';
import { getStorageConnection, updateStorageConnection } from '../../supabase/service';
import { decryptToken, encryptToken } from '../../utils/encryption';
import { env } from '../../env';
import { StorageProviderError, STORAGE_ERROR_CODES } from '../../errors/storage-errors';

/**
 * Dropbox Storage Adapter
 * 
 * Implements the StorageProvider interface for Dropbox.
 * Handles file uploads, downloads, and deletions using Dropbox API v2.
 * Implements lazy 401 retry pattern for automatic token refresh.
 */
export class DropboxAdapter implements StorageProvider {
  readonly name = 'dropbox' as const;

  /**
   * Upload a file to Dropbox.
   * Implements lazy 401 retry pattern - automatically refreshes tokens on expiration.
   */
  async upload(file: File, path: string, userId: string): Promise<StorageUploadResult> {
    try {
      return await this.uploadInternal(file, path, userId);
    } catch (error) {
      // Check if it's a 401 (unauthorized/expired token)
      if (this.is401Error(error)) {
        console.log(`Dropbox token expired for user ${userId}, attempting refresh...`);
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          throw new StorageProviderError(
            STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED,
            'Dropbox token expired and refresh failed',
            { provider: 'dropbox' }
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
    const connection = await getStorageConnection(userId, 'dropbox');
    const accessToken = decryptToken(connection.encrypted_access_token);
    
    const dbx = new Dropbox({ 
      accessToken,
      fetch: fetch as any, // Provide fetch for server-side usage
    });
    
    // Convert File to ArrayBuffer then Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to /UntitledOne/{path}
    const dropboxPath = `/UntitledOne/${path}`;
    const result = await dbx.filesUpload({
      path: dropboxPath,
      contents: buffer,
      mode: { '.tag': 'add' },
      autorename: true, // Auto-rename if file exists
      mute: false,
    });

    // Update last_used_at timestamp
    await updateStorageConnection(userId, 'dropbox', {
      last_used_at: new Date().toISOString(),
    });

    return {
      fileId: result.result.id,
      path: result.result.path_display || dropboxPath,
      size: result.result.size,
      metadata: {
        rev: result.result.rev,
        serverModified: result.result.server_modified,
        contentHash: result.result.content_hash,
      },
    };
  }

  /**
   * Generate a temporary download URL for a Dropbox file.
   * Implements lazy 401 retry pattern.
   */
  async getDownloadUrl(
    fileId: string,
    userId: string,
    expiresIn: number = 600
  ): Promise<string> {
    try {
      return await this.getDownloadUrlInternal(fileId, userId);
    } catch (error) {
      if (this.is401Error(error)) {
        console.log(`Dropbox token expired for user ${userId}, attempting refresh...`);
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          throw new StorageProviderError(
            STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED,
            'Dropbox token expired and refresh failed',
            { provider: 'dropbox' }
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
   */
  private async getDownloadUrlInternal(
    fileId: string,
    userId: string
  ): Promise<string> {
    const connection = await getStorageConnection(userId, 'dropbox');
    const accessToken = decryptToken(connection.encrypted_access_token);
    
    const dbx = new Dropbox({ 
      accessToken,
      fetch: fetch as any,
    });
    
    // Get temporary link (valid for 4 hours)
    const result = await dbx.filesGetTemporaryLink({ path: fileId });

    // Update last_used_at timestamp
    await updateStorageConnection(userId, 'dropbox', {
      last_used_at: new Date().toISOString(),
    });

    return result.result.link;
  }

  /**
   * Delete a file from Dropbox.
   * Implements lazy 401 retry pattern.
   */
  async delete(fileId: string, userId: string): Promise<void> {
    try {
      await this.deleteInternal(fileId, userId);
    } catch (error) {
      if (this.is401Error(error)) {
        console.log(`Dropbox token expired for user ${userId}, attempting refresh...`);
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          throw new StorageProviderError(
            STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED,
            'Dropbox token expired and refresh failed',
            { provider: 'dropbox' }
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
    const connection = await getStorageConnection(userId, 'dropbox');
    const accessToken = decryptToken(connection.encrypted_access_token);
    
    const dbx = new Dropbox({ 
      accessToken,
      fetch: fetch as any,
    });
    
    await dbx.filesDeleteV2({ path: fileId });

    // Update last_used_at timestamp
    await updateStorageConnection(userId, 'dropbox', {
      last_used_at: new Date().toISOString(),
    });
  }

  /**
   * Validate that the user has an active Dropbox connection.
   */
  async validateConnection(userId: string): Promise<boolean> {
    try {
      const connection = await getStorageConnection(userId, 'dropbox');
      return connection.status === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Refresh Dropbox access token using refresh token.
   * Updates the stored connection with new token and status.
   */
  async refreshTokens(userId: string): Promise<boolean> {
    try {
      const connection = await getStorageConnection(userId, 'dropbox');
      
      if (!connection.encrypted_refresh_token) {
        console.error('No refresh token available for Dropbox connection');
        return false;
      }

      const refreshToken = decryptToken(connection.encrypted_refresh_token);
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
        await updateStorageConnection(userId, 'dropbox', {
          status: 'expired',
        });
        
        return false;
      }

      const tokens = await response.json();
      const newAccessToken = encryptToken(tokens.access_token);
      const tokenExpiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      // Update connection with new token
      await updateStorageConnection(userId, 'dropbox', {
        encrypted_access_token: newAccessToken,
        token_expires_at: tokenExpiresAt,
        status: 'active',
        last_used_at: new Date().toISOString(),
      });

      console.log(`✓ Dropbox token refreshed successfully for user ${userId}`);
      return true;

    } catch (error) {
      console.error('Error refreshing Dropbox token:', error);
      
      // Update status to error
      await updateStorageConnection(userId, 'dropbox', {
        status: 'error',
      }).catch(() => {});
      
      return false;
    }
  }

  /**
   * Helper to detect 401 errors from Dropbox API.
   */
  private is401Error(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 401
    );
  }
}

