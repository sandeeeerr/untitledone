import type { StorageProvider, StorageProviderType } from './types';
import { LocalStorageAdapter } from './adapters/local';
import { getStorageConnection } from '../supabase/service';
import { StorageProviderError, STORAGE_ERROR_CODES } from '../errors/storage-errors';

/**
 * Factory function to get the appropriate storage provider adapter.
 * 
 * CRITICAL DESIGN PRINCIPLE:
 * This is the single entry point for all storage operations.
 * All code that needs to upload, download, or delete files MUST use this factory.
 * 
 * @param provider - The storage provider type
 * @param userId - The user ID for connection validation and authentication
 * @returns The appropriate StorageProvider implementation
 * @throws Error if provider not connected (for external providers) or invalid provider type
 */
export async function getStorageProvider(
  provider: StorageProviderType,
  userId: string
): Promise<StorageProvider> {
  // Local storage doesn't require a connection
  if (provider === 'local') {
    return new LocalStorageAdapter();
  }

  // For external providers, validate that connection exists and is active
  try {
    const connection = await getStorageConnection(userId, provider);

    if (connection.status !== 'active') {
      throw new Error(`Storage connection for ${provider} is not active (status: ${connection.status})`);
    }

    // Dynamically import and instantiate provider adapter
    // This keeps the bundle size small - only load provider SDKs when needed
    if (provider === 'dropbox') {
      const { DropboxAdapter } = await import('./adapters/dropbox');
      return new DropboxAdapter();
    }

    if (provider === 'google_drive') {
      const { GoogleDriveAdapter } = await import('./adapters/google-drive');
      return new GoogleDriveAdapter();
    }

    throw new Error(`Unknown storage provider: ${provider}`);
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a "not found" error (no connection exists)
      if (error.message.includes('No storage connection found')) {
        throw new StorageProviderError(
          STORAGE_ERROR_CODES.PROVIDER_NOT_CONNECTED,
          `${provider} is not connected for this user`,
          { provider }
        );
      }
      // Re-throw with context
      throw new StorageProviderError(
        STORAGE_ERROR_CODES.PROVIDER_API_ERROR,
        `Failed to get storage provider ${provider}: ${error.message}`,
        { provider, cause: error }
      );
    }
    throw error;
  }
}

/**
 * Check if a user has an active connection to a specific provider.
 * Useful for UI to determine which providers to show as available.
 * 
 * @param provider - The storage provider type
 * @param userId - The user ID to check
 * @returns True if user has an active connection to the provider
 */
export async function hasActiveConnection(
  provider: StorageProviderType,
  userId: string
): Promise<boolean> {
  if (provider === 'local') {
    return true; // Local storage is always available
  }

  try {
    const connection = await getStorageConnection(userId, provider);
    return connection.status === 'active';
  } catch {
    return false;
  }
}

