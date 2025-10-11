/**
 * Storage Provider Interface
 * 
 * Unified interface for all storage operations across local and external providers.
 * ALL storage operations (local, Dropbox, Drive, future providers) MUST go through this interface.
 * No direct provider SDK calls should be made outside of adapter implementations.
 */

export type StorageProviderType = 'local' | 'dropbox' | 'google_drive';

export interface StorageProvider {
  /** The name/type of this storage provider */
  name: StorageProviderType;

  /**
   * Upload a file to storage.
   * 
   * @param file - The file to upload
   * @param path - The path/key where the file should be stored
   * @param userId - The user ID for connection/authentication
   * @returns Upload result with provider-specific file ID and metadata
   * @throws Error if upload fails or connection is invalid
   */
  upload(file: File, path: string, userId: string): Promise<StorageUploadResult>;

  /**
   * Generate a time-limited download URL for a file.
   * 
   * @param fileId - The provider-specific file identifier
   * @param userId - The user ID for connection/authentication (owner's ID for ownership proxying)
   * @param expiresIn - Optional expiry time in seconds (default: 600 = 10 minutes)
   * @returns Time-limited signed download URL
   * @throws Error if file not found or connection is invalid
   */
  getDownloadUrl(fileId: string, userId: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage.
   * 
   * @param fileId - The provider-specific file identifier
   * @param userId - The user ID for connection/authentication
   * @throws Error if deletion fails or connection is invalid
   */
  delete(fileId: string, userId: string): Promise<void>;

  /**
   * Validate that the user's connection to this provider is active and tokens are valid.
   * 
   * @param userId - The user ID to check connection for
   * @returns True if connection is valid and active
   */
  validateConnection(userId: string): Promise<boolean>;

  /**
   * Refresh access tokens for this provider.
   * Used by the lazy 401 retry pattern and background token refresh.
   * 
   * @param userId - The user ID to refresh tokens for
   * @returns True if refresh succeeded, false otherwise
   */
  refreshTokens(userId: string): Promise<boolean>;
}

export interface StorageUploadResult {
  /** Provider-specific file identifier (e.g., Dropbox file ID, Drive file ID, or Supabase Storage path) */
  fileId: string;

  /** Full path/key where file is stored */
  path: string;

  /** File size in bytes */
  size: number;

  /** Provider-specific metadata (e.g., revision, mime type, etc.) */
  metadata: Record<string, unknown>;
}

/**
 * Storage connection information (safe for frontend consumption).
 * NEVER includes encrypted tokens or sensitive data.
 */
export interface StorageConnection {
  provider: StorageProviderType;
  providerAccountName: string | null;
  status: 'active' | 'expired' | 'error';
  connectedAt: string;
  lastUsedAt: string | null;
}

/**
 * Storage connection record from database (backend-only).
 * Includes encrypted tokens - NEVER send to frontend.
 */
export interface StorageConnectionRecord {
  id: string;
  user_id: string;
  provider: StorageProviderType;
  provider_account_id: string | null;
  provider_account_name: string | null;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  encryption_key_version: string;
  token_expires_at: string | null;
  connected_at: string;
  last_used_at: string | null;
  status: 'active' | 'expired' | 'error';
  created_at: string;
  updated_at: string;
}

