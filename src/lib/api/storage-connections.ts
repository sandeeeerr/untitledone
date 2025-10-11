import type { StorageConnection } from '@/lib/storage/types';

/**
 * Client-side API functions for storage connection management.
 * These functions interact with the backend API routes that use service role access.
 */

/**
 * Fetch all storage connections for the current user.
 * Returns safe metadata only (no encrypted tokens).
 */
export async function getStorageConnections(): Promise<StorageConnection[]> {
  const res = await fetch('/api/storage/connections', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    let message = 'Failed to fetch storage connections';
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as StorageConnection[];
}

/**
 * Delete (disconnect) a storage provider connection.
 * Files stored in the provider will become inaccessible until reconnected.
 */
export async function deleteStorageConnection(
  provider: 'dropbox' | 'google_drive'
): Promise<void> {
  // Convert underscore to hyphen for URL
  const providerSlug = provider.replace(/_/g, '-');
  const res = await fetch(`/api/storage/connections/${providerSlug}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    let message = 'Failed to disconnect storage provider';
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }
}

/**
 * Manually refresh tokens for a storage provider.
 * Useful when a connection has expired and user wants to restore it.
 */
export async function refreshStorageConnection(
  provider: 'dropbox' | 'google_drive'
): Promise<{ success: boolean; status: string }> {
  // Convert underscore to hyphen for URL
  const providerSlug = provider.replace(/_/g, '-');
  const res = await fetch(`/api/storage/connections/${providerSlug}/refresh`, {
    method: 'POST',
  });

  if (!res.ok) {
    let message = 'Failed to refresh storage connection';
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as { success: boolean; status: string };
}

/**
 * Initiate OAuth flow for a storage provider.
 * Uses direct redirect instead of popup for better compatibility.
 * 
 * @param provider - The storage provider to connect
 * @returns Promise that resolves immediately (redirect happens)
 */
export async function initiateOAuthFlow(
  provider: 'dropbox' | 'google_drive'
): Promise<void> {
  // Convert underscore to hyphen for URL
  const providerSlug = provider.replace(/_/g, '-');
  
  // Direct redirect to OAuth flow
  window.location.href = `/api/storage/connect/${providerSlug}`;
}

