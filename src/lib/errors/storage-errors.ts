/**
 * Storage Provider Error Codes
 * 
 * Standard error codes for external storage operations.
 * Used across all storage providers for consistent error handling.
 */

export const STORAGE_ERROR_CODES = {
  /** User hasn't connected the selected storage provider */
  PROVIDER_NOT_CONNECTED: 'PROVIDER_NOT_CONNECTED',
  
  /** Provider access token expired and refresh failed */
  PROVIDER_TOKEN_EXPIRED: 'PROVIDER_TOKEN_EXPIRED',
  
  /** Provider API returned an error */
  PROVIDER_API_ERROR: 'PROVIDER_API_ERROR',
  
  /** User's storage quota at the provider is exceeded */
  PROVIDER_QUOTA_EXCEEDED: 'PROVIDER_QUOTA_EXCEEDED',
  
  /** File no longer exists at the provider */
  PROVIDER_FILE_NOT_FOUND: 'PROVIDER_FILE_NOT_FOUND',
} as const;

export type StorageErrorCode = typeof STORAGE_ERROR_CODES[keyof typeof STORAGE_ERROR_CODES];

/**
 * Custom error class for storage provider operations.
 * Includes error code for programmatic error handling.
 */
export class StorageProviderError extends Error {
  public readonly code: StorageErrorCode;
  public readonly provider?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: StorageErrorCode,
    message: string,
    options?: {
      provider?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'StorageProviderError';
    this.code = code;
    this.provider = options?.provider;
    this.details = options?.details;
    
    if (options?.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown (Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageProviderError);
    }
  }

  /**
   * Get a user-friendly error message based on the error code.
   */
  getUserMessage(): string {
    const providerName = this.provider === 'dropbox' ? 'Dropbox' 
      : this.provider === 'google_drive' ? 'Google Drive'
      : 'storage provider';

    switch (this.code) {
      case STORAGE_ERROR_CODES.PROVIDER_NOT_CONNECTED:
        return `Please connect your ${providerName} account in Settings`;
      
      case STORAGE_ERROR_CODES.PROVIDER_TOKEN_EXPIRED:
        return `Your ${providerName} connection expired. Please reconnect in Settings.`;
      
      case STORAGE_ERROR_CODES.PROVIDER_API_ERROR:
        return `Failed to upload to ${providerName}. Please try again.`;
      
      case STORAGE_ERROR_CODES.PROVIDER_QUOTA_EXCEEDED:
        return `Your ${providerName} storage is full. Please free up space or use a different provider.`;
      
      case STORAGE_ERROR_CODES.PROVIDER_FILE_NOT_FOUND:
        return `File not found in ${providerName}. It may have been deleted.`;
      
      default:
        return this.message || 'An unexpected storage error occurred';
    }
  }
}

/**
 * Helper to check if an error is a StorageProviderError with a specific code.
 */
export function isStorageError(error: unknown, code?: StorageErrorCode): boolean {
  if (!(error instanceof StorageProviderError)) {
    return false;
  }
  
  if (code) {
    return error.code === code;
  }
  
  return true;
}

/**
 * Helper to extract error code from any error (including plain Error with code in message).
 */
export function getStorageErrorCode(error: unknown): StorageErrorCode | null {
  if (error instanceof StorageProviderError) {
    return error.code;
  }
  
  // Check if error message contains error code
  if (error instanceof Error) {
    for (const [_key, code] of Object.entries(STORAGE_ERROR_CODES)) {
      if (error.message.includes(code)) {
        return code as StorageErrorCode;
      }
    }
  }
  
  return null;
}

