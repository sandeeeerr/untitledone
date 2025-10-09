import { NextRequest, NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

/**
 * POST /api/projects/[id]/leave
 * Leave a project (remove yourself as member)
 * Only works if you're not the owner
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await context.params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the owner (owners can't leave their own projects)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.owner_id === user.id) {
      return NextResponse.json(
        { error: 'Project owner cannot leave. Transfer ownership or delete the project instead.' },
        { status: 400 }
      );
    }

    // Check if user is actually a member
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 404 }
      );
    }

    // Remove membership (RLS policy allows this)
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to leave project:', deleteError);
      return NextResponse.json(
        { error: 'Failed to leave project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, project_id: projectId }, { status: 200 });
  } catch (error) {
    console.error('Leave project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

