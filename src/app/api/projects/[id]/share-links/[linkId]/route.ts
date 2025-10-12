import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
  linkId: z.string().uuid("Invalid link ID format"),
});

/**
 * DELETE /api/projects/[id]/share-links/[linkId]
 * 
 * Revoke a share link
 * Only the link creator or project owner can revoke
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Validate params
  const { id, linkId } = await params;
  const paramValidation = paramsSchema.safeParse({ id, linkId });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const projectId = paramValidation.data.id;
  const shareLinkId = paramValidation.data.linkId;

  // Fetch the share link to check permissions
  const { data: link, error: linkError } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .select("id, project_id, created_by")
    .eq("id", shareLinkId)
    .eq("project_id", projectId)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  // Check if user is creator or project owner
  const isCreator = link.created_by === user.id;

  if (!isCreator) {
    // Check if user is project owner
    const { data: project } = await (supabase as SupabaseClient)
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    const isOwner = project?.owner_id === user.id;

    if (!isOwner) {
      return NextResponse.json({ error: "Only the link creator or project owner can revoke" }, { status: 403 });
    }
  }

  // Revoke the link (set revoked = true)
  const { error: updateError } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .update({ revoked: true })
    .eq("id", shareLinkId);

  if (updateError) {
    console.error("Failed to revoke share link:", updateError);
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

