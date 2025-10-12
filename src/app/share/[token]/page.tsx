import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { isLinkExpired } from "@/lib/utils/share-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ShareRedemptionPageProps {
  params: Promise<{ token: string }>;
}

/**
 * Share Link Redemption Page
 * 
 * Handles redemption of temporary share links:
 * 1. Checks authentication (redirects to login if needed)
 * 2. Validates token (not expired, used, or revoked)
 * 3. Grants viewer access by adding user to project_members
 * 4. Marks link as used
 * 5. Redirects to project page
 * 
 * Errors redirect to /share/[token]/error?reason=[reason]
 */
export default async function ShareRedemptionPage({ params }: ShareRedemptionPageProps) {
  const { token } = await params;
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(`/share/${token}`);
    redirect(`/auth/login?redirect=${returnUrl}`);
  }

  // Fetch share link
  const { data: link, error: linkError } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .select("id, project_id, created_by, expires_at, used_by, used_at, revoked")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    redirect(`/share/${token}/error?reason=not_found`);
  }

  // Validate link is not revoked
  if (link.revoked) {
    redirect(`/share/${token}/error?reason=revoked`);
  }

  // Validate link is not expired
  if (isLinkExpired(link.expires_at)) {
    redirect(`/share/${token}/error?reason=expired`);
  }

  // Validate link is not already used
  if (link.used_by) {
    // If the current user already used this link, just redirect to project
    if (link.used_by === user.id) {
      redirect(`/projects/${link.project_id}`);
    }
    // Otherwise, link was used by someone else
    redirect(`/share/${token}/error?reason=used`);
  }

  // Check if project exists
  const { data: project, error: projectError } = await (supabase as SupabaseClient)
    .from("projects")
    .select("id, owner_id, name")
    .eq("id", link.project_id)
    .single();

  if (projectError || !project) {
    redirect(`/share/${token}/error?reason=project_not_found`);
  }

  // Check if user is already a member or owner
  const isOwner = project.owner_id === user.id;
  
  if (!isOwner) {
    const { data: existingMembership } = await (supabase as SupabaseClient)
      .from("project_members")
      .select("id")
      .eq("project_id", link.project_id)
      .eq("user_id", user.id)
      .single();

    if (!existingMembership) {
      // Add user as viewer
      const { error: memberError } = await (supabase as SupabaseClient)
        .from("project_members")
        .insert({
          project_id: link.project_id,
          user_id: user.id,
          role: "viewer",
          added_by: link.created_by,
        });

      if (memberError) {
        console.error("Failed to add viewer:", memberError);
        redirect(`/share/${token}/error?reason=failed_to_add_member`);
      }
    }
  }

  // Mark link as used
  const { error: updateError } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .update({
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  if (updateError) {
    console.error("Failed to mark link as used:", updateError);
    // Don't fail redemption if we can't update the link
  }

  // Success! Redirect to project with success message
  redirect(`/projects/${link.project_id}?share_link_redeemed=true`);
}

