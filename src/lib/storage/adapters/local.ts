import type { StorageProvider, StorageUploadResult } from '../types';
import { 
  uploadProjectObject, 
  getSignedDownloadUrl, 
  removeObject 
} from '../../supabase/storage';

/**
 * Local Storage Adapter
 * 
 * Wraps the existing Supabase Storage implementation to conform to the StorageProvider interface.
 * This adapter handles file storage in the Supabase Storage bucket (local to the platform).
 */
export class LocalStorageAdapter implements StorageProvider {
  readonly name = 'local' as const;

  /**
   * Upload a file to Supabase Storage.
   * Wraps the existing uploadProjectObject function.
   */
  async upload(file: File, path: string, _userId: string): Promise<StorageUploadResult> {
    // Extract projectId from path if present (format: projectId/filename)
    const pathParts = path.split('/');
    const projectId = pathParts.length > 1 ? pathParts[0] : '';
    
    // Upload to Supabase Storage using existing function
    const storageKey = await uploadProjectObject({
      projectId,
      file,
      path,
    });

    return {
      fileId: storageKey,
      path: storageKey,
      size: file.size,
      metadata: {
        contentType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate a signed download URL for a file in Supabase Storage.
   * Wraps the existing getSignedDownloadUrl function.
   */
  async getDownloadUrl(fileId: string, _userId: string, expiresIn: number = 600): Promise<string> {
    // For local storage, fileId is the storage path/key
    const signedUrl = await getSignedDownloadUrl(fileId, expiresIn);
    return signedUrl;
  }

  /**
   * Delete a file from Supabase Storage.
   * Wraps the existing removeObject function.
   */
  async delete(fileId: string, _userId: string): Promise<void> {
    // For local storage, fileId is the storage path/key
    await removeObject(fileId);
  }

  /**
   * Validate connection to local storage.
   * Local storage is always available, so always returns true.
   */
  async validateConnection(_userId: string): Promise<boolean> {
    return true;
  }

  /**
   * Refresh tokens for local storage.
   * Local storage doesn't use tokens, so always returns true.
   */
  async refreshTokens(_userId: string): Promise<boolean> {
    return true;
  }
}

