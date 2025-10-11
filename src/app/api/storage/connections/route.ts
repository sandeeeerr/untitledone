import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { StorageConnection } from '@/lib/storage/types';

/**
 * Storage Connections List Endpoint
 * 
 * GET: Lists all storage connections for the authenticated user
 * Returns safe metadata only (NEVER returns encrypted tokens)
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

    // Use service client to query storage_connections table
    // This bypasses RLS since the table denies all direct access
    const serviceClient = createServiceClient();
    const { data: connections, error: queryError } = await serviceClient
      .from('storage_connections')
      .select('provider, provider_account_name, status, connected_at, last_used_at')
      .eq('user_id', user.id);

    if (queryError) {
      console.error('Failed to query storage connections:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch storage connections' },
        { status: 500 }
      );
    }

    // Map to safe StorageConnection type (no sensitive data)
    const safeConnections: StorageConnection[] = (connections || []).map(conn => ({
      provider: conn.provider as 'dropbox' | 'google_drive',
      providerAccountName: conn.provider_account_name,
      status: conn.status as 'active' | 'expired' | 'error',
      connectedAt: conn.connected_at,
      lastUsedAt: conn.last_used_at,
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

