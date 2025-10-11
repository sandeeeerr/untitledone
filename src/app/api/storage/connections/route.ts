import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { StorageConnection } from '@/lib/storage/types';

/**
 * Storage Connections Endpoint
 * 
 * GET: List all storage connections for the authenticated user
 */
export async function GET() {
  try {
    // Authenticate user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use service client to access storage_connections table
    // (Regular client is blocked by RLS policy)
    const serviceClient = createServiceClient();
    
    const { data: connections, error } = await serviceClient
      .from('storage_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch storage connections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch storage connections' },
        { status: 500 }
      );
    }

    // Transform to client-safe format (remove sensitive fields)
    const safeConnections: StorageConnection[] = (connections || []).map(conn => ({
      id: conn.id,
      userId: conn.user_id,
      provider: conn.provider as 'dropbox' | 'google_drive',
      providerAccountId: conn.provider_account_id || '',
      providerAccountName: conn.provider_account_name || '',
      // Don't send encrypted tokens to client
      encrypted_access_token: '', 
      encrypted_refresh_token: null,
      encryption_key_version: conn.encryption_key_version,
      tokenExpiresAt: conn.token_expires_at,
      connectedAt: conn.connected_at,
      lastUsedAt: conn.last_used_at,
      status: conn.status as 'active' | 'expired' | 'error',
      createdAt: conn.created_at,
      updatedAt: conn.updated_at,
    }));

    return NextResponse.json(safeConnections, { status: 200 });

  } catch (error) {
    console.error('Error fetching storage connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}