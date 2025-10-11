import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase/server';
import { getUserUsedBytes } from '@/lib/supabase/storage';
import { getMaxUserStorageBytes } from '@/lib/env';

/**
 * Storage Usage Endpoint
 * 
 * GET: Get current storage usage for the authenticated user
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

    // Get user's storage usage (only local storage files count)
    const usedBytes = await getUserUsedBytes(user.id);
    const maxBytes = getMaxUserStorageBytes();
    
    const usedMB = usedBytes / (1024 * 1024);
    const maxMB = maxBytes / (1024 * 1024);
    const remainingMB = Math.max(0, maxMB - usedMB);
    const percentUsed = maxMB > 0 ? (usedMB / maxMB) * 100 : 0;

    return NextResponse.json({
      bytesUsed: usedBytes,
      bytesMax: maxBytes,
      bytesRemaining: Math.max(0, maxBytes - usedBytes),
      mbUsed: Math.round(usedMB * 10) / 10, // Round to 1 decimal
      mbMax: Math.round(maxMB),
      mbRemaining: Math.round(remainingMB * 10) / 10,
      percentUsed: Math.round(percentUsed * 10) / 10,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage usage' },
      { status: 500 }
    );
  }
}