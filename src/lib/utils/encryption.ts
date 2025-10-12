import crypto from 'crypto';
import { createServiceClient } from '../supabase/service';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const _AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a token using AES-256-GCM with versioned encryption keys.
 * 
 * Format: version:iv:authTag:encrypted
 * Example: v1:a1b2c3d4...:e5f6g7h8...:i9j0k1l2...
 * 
 * @param token - The plaintext token to encrypt
 * @param keyVersion - Optional key version (defaults to current version from env)
 * @returns Encrypted token string in versioned format
 */
export function encryptToken(token: string, keyVersion?: string): string {
  const version = keyVersion || process.env.STORAGE_TOKEN_ENCRYPTION_CURRENT_VERSION || 'v1';
  const key = getEncryptionKey(version);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: version:iv:authTag:encrypted
  return `${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a token that was encrypted with encryptToken().
 * Automatically handles versioned encryption keys.
 * 
 * @param encryptedData - The encrypted token string in versioned format
 * @returns Decrypted plaintext token
 * @throws Error if format is invalid or decryption fails
 */
export function decryptToken(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted token format');
  }

  const [version, ivHex, authTagHex, encrypted] = parts;
  const key = getEncryptionKey(version);

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Retrieves the encryption key for a specific version from environment variables.
 * 
 * Environment variable format: STORAGE_TOKEN_ENCRYPTION_KEY_V1, STORAGE_TOKEN_ENCRYPTION_KEY_V2, etc.
 * 
 * @param version - The key version (e.g., 'v1', 'v2')
 * @returns Buffer containing the encryption key
 * @throws Error if key not found in environment
 */
function getEncryptionKey(version: string): Buffer {
  const envVarName = `STORAGE_TOKEN_ENCRYPTION_KEY_${version.toUpperCase()}`;
  const keyHex = process.env[envVarName];

  if (!keyHex) {
    throw new Error(`Encryption key for version ${version} not found. Set ${envVarName} in environment.`);
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Background job to rotate encryption keys.
 * Re-encrypts all tokens in storage_connections table with a new key version.
 * 
 * Usage:
 * 1. Add new key to environment: STORAGE_TOKEN_ENCRYPTION_KEY_V2
 * 2. Update STORAGE_TOKEN_ENCRYPTION_CURRENT_VERSION to 'v2'
 * 3. Run this function to re-encrypt all existing tokens
 * 4. Old key (v1) should be kept in environment until all tokens are rotated
 * 
 * @param newVersion - The new key version to use (e.g., 'v2')
 * @returns Object with rotation statistics
 */
export async function rotateEncryptionKeys(newVersion: string): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ connectionId: string; error: string }>;
}> {
  const supabase = createServiceClient();

  // Get all connections with old keys
  const { data: connections, error: fetchError } = await supabase
    .from('storage_connections')
    .select('id, user_id, provider, encrypted_access_token, encrypted_refresh_token, encryption_key_version')
    .neq('encryption_key_version', newVersion);

  if (fetchError) {
    throw new Error(`Failed to fetch connections for key rotation: ${fetchError.message}`);
  }

  const stats = {
    total: connections?.length || 0,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ connectionId: string; error: string }>,
  };

  for (const conn of connections || []) {
    try {
      // Decrypt with old key
      const accessToken = decryptToken(conn.encrypted_access_token);
      const refreshToken = conn.encrypted_refresh_token ? decryptToken(conn.encrypted_refresh_token) : null;

      // Re-encrypt with new key
      const newAccessToken = encryptToken(accessToken, newVersion);
      const newRefreshToken = refreshToken ? encryptToken(refreshToken, newVersion) : null;

      // Update in database
      const { error: updateError } = await supabase
        .from('storage_connections')
        .update({
          encrypted_access_token: newAccessToken,
          encrypted_refresh_token: newRefreshToken,
          encryption_key_version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conn.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      stats.successful++;
      console.warn(`✓ Rotated keys for connection ${conn.id} (${conn.provider})`);
    } catch (error) {
      stats.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push({ connectionId: conn.id, error: errorMessage });
      console.error(`✗ Failed to rotate keys for connection ${conn.id}:`, errorMessage);
    }
  }

  return stats;
}

