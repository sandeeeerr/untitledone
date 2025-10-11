import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase/server';
import { deleteStorageConnection } from '@/lib/supabase/service';

type Provider = 'dropbox' | 'google_drive';

/**
 * Normalize provider slug from URL (google-drive) to internal format (google_drive)
 */
function normalizeProvider(slug: string): Provider | null {
  const normalized = slug.replace(/-/g, '_');
  if (normalized === 'dropbox' || normalized === 'google_drive') {
    return normalized as Provider;
  }
  return null;
}

/**
 * Storage Connection Management Endpoint
 * 
 * DELETE: Disconnects a storage provider for the authenticated user
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
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

    // Validate and normalize provider parameter
    const { provider: providerRaw } = await params;
    const provider = normalizeProvider(providerRaw);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "dropbox" or "google-drive"' },
        { status: 400 }
      );
    }

    // Delete the storage connection using service role client
    // This removes the connection record from the database
    // Files will remain in project_files table but become inaccessible
    await deleteStorageConnection(user.id, provider);

    return NextResponse.json(
      { success: true, provider },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting storage connection:', error);
    
    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes('No storage connection found')) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete storage connection' },
      { status: 500 }
    );
  }
}

