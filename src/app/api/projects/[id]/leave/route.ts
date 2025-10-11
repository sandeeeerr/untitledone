import { NextResponse } from 'next/server';
import { z } from 'zod';
import createServerClient from '@/lib/supabase/server';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
});

/**
 * Leave Project Endpoint
 * 
 * POST: Remove the authenticated user from project members
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const projectId = validation.data.id;

    // Check if user is a member (not owner)
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.owner_id === user.id) {
      return NextResponse.json(
        { error: 'Project owner cannot leave. Delete the project instead.' },
        { status: 400 }
      );
    }

    // Remove user from project members
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

    return NextResponse.json(
      { success: true, project_id: projectId },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error leaving project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
