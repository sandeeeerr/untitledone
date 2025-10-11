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
 * Opens popup window, handles OAuth redirect, and returns when complete.
 * 
 * @param provider - The storage provider to connect
 * @returns Promise that resolves when connection is successful
 */
export async function initiateOAuthFlow(
  provider: 'dropbox' | 'google_drive'
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Convert underscore to hyphen for URL
    const providerSlug = provider.replace(/_/g, '-');
    
    // Open OAuth popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `/api/storage/connect/${providerSlug}`,
      `oauth-${provider}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    // Listen for postMessage from callback page
    const messageHandler = (event: MessageEvent) => {
      // Verify message is from our OAuth callback
      // Normalize the provider from the message (might have hyphen or underscore)
      const messageProvider = event.data?.provider?.replace(/-/g, '_');
      
      if (
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'storage-connection-success' &&
        messageProvider === provider
      ) {
        window.removeEventListener('message', messageHandler);
        resolve();
      }
    };

    window.addEventListener('message', messageHandler);

    // Check if popup was closed without completing OAuth
    const popupCheckInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupCheckInterval);
        window.removeEventListener('message', messageHandler);
        
        // If we received the success message, resolve is already called
        // Otherwise, user likely closed the popup
        reject(new Error('OAuth flow was cancelled'));
      }
    }, 500);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
      }
      clearInterval(popupCheckInterval);
      window.removeEventListener('message', messageHandler);
      reject(new Error('OAuth flow timed out'));
    }, 5 * 60 * 1000);
  });
}

