import { NextResponse } from 'next/server';
import { z } from 'zod';
import createServerClient from '@/lib/supabase/server';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Project Invitations Endpoint
 * 
 * GET: List all invitations for a project
 * POST: Create a new invitation
 */
export async function GET(
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

    // Check if user has access to the project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only owner can view invitations
    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only project owner can view invitations' },
        { status: 403 }
      );
    }

    // Fetch invitations
    const { data: invitations, error } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json(invitations || [], { status: 200 });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Parse request body
    const body = await request.json();
    const inviteValidation = inviteSchema.safeParse(body);

    if (!inviteValidation.success) {
      return NextResponse.json(
        { error: 'Invalid invitation data' },
        { status: 400 }
      );
    }

    const { email } = inviteValidation.data;

    // Check if user is the project owner
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only project owner can send invitations' },
        { status: 403 }
      );
    }

    // For now, we'll create the invitation without checking if the user exists
    // The invitation acceptance process will handle user creation if needed
    // This allows inviting both existing and new users
    
    // Note: We can't easily check if user exists without a database function
    // since we can't directly query auth.users from the API
    // The invitation system will work for both existing and new users

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('project_invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .is('accepted_at', null)
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invitation already sent to this user' },
        { status: 400 }
      );
    }

    // Generate token for invitation
    const tokenHash = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        invited_by: user.id,
        email: email,
        role: 'member',
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select('id, project_id')
      .single();

    if (inviteError || !invitation) {
      console.error('Failed to create invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json(invitation, { status: 201 });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
