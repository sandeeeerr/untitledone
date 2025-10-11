import { createClient } from '@supabase/supabase-js';
import { env } from '../env';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client with service role key for backend-only operations.
 * 
 * CRITICAL SECURITY:
 * - This client bypasses Row Level Security (RLS)
 * - NEVER expose this client to frontend or user-context code
 * - Use ONLY for server-side operations that require service role access
 * - Primary use case: accessing storage_connections table for encrypted tokens
 * 
 * @returns Supabase client with service role privileges
 */
export function createServiceClient() {
  const supabaseUrl = env().SUPABASE_URL;
  const serviceRoleKey = env().SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Retrieves a storage connection record for a specific user and provider.
 * Uses service role client to bypass RLS and access encrypted tokens.
 * 
 * @param userId - The user's ID
 * @param provider - The storage provider ('dropbox' or 'google_drive')
 * @returns The storage connection record
 * @throws Error if connection not found or query fails
 */
export async function getStorageConnection(
  userId: string, 
  provider: string
): Promise<Database['public']['Tables']['storage_connections']['Row']> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('storage_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error) {
    throw new Error(`Failed to get storage connection: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No storage connection found for provider: ${provider}`);
  }

  return data;
}

/**
 * Updates a storage connection record.
 * Uses service role client to bypass RLS.
 * 
 * @param userId - The user's ID
 * @param provider - The storage provider
 * @param updates - Partial updates to apply
 * @throws Error if update fails
 */
export async function updateStorageConnection(
  userId: string,
  provider: string,
  updates: {
    encrypted_access_token?: string;
    encrypted_refresh_token?: string | null;
    token_expires_at?: string | null;
    status?: 'active' | 'expired' | 'error';
    last_used_at?: string;
  }
) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('storage_connections')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to update storage connection: ${error.message}`);
  }
}

/**
 * Deletes a storage connection record.
 * Uses service role client to bypass RLS.
 * 
 * @param userId - The user's ID
 * @param provider - The storage provider
 * @throws Error if deletion fails
 */
export async function deleteStorageConnection(userId: string, provider: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('storage_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to delete storage connection: ${error.message}`);
  }
}

