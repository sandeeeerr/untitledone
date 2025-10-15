import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { generateSecureToken, calculateExpiry } from "@/lib/utils/share-links";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

/**
 * POST /api/projects/[id]/share-links
 * 
 * Generate a new 1-hour share link for a project
 * Maximum 3 active links per project
 * Single-use links that grant viewer access
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Validate project ID
  const { id } = await params;
  const paramValidation = paramsSchema.safeParse({ id });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const projectId = paramValidation.data.id;

  // Verify user is project owner or member
  const { data: project } = await (supabase as SupabaseClient)
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.owner_id === user.id;

  if (!isOwner) {
    // Check if user is a member
    const { data: membership } = await (supabase as SupabaseClient)
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // Check count of active links (not expired, not used, not revoked)
  const now = new Date().toISOString();
  const { count, error: countError } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("used_by", null)
    .eq("revoked", false)
    .gt("expires_at", now);

  if (countError) {
    console.error("Failed to count active links:", countError);
    return NextResponse.json({ error: "Failed to check link count" }, { status: 500 });
  }

  if ((count || 0) >= 3) {
    return NextResponse.json(
      { error: "Maximum of 3 active links reached" },
      { status: 400 }
    );
  }

  // Generate token and expiration
  const token = generateSecureToken();
  const expiresAt = calculateExpiry(1); // 1 hour

  // Insert share link
  const { data: link, error: insertError } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .insert({
      project_id: projectId,
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token, expires_at, created_at")
    .single();

  if (insertError || !link) {
    console.error("Failed to create share link:", insertError);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  // Build full URL - always use production URL in production
  const siteUrl = process.env.NODE_ENV === 'production'
    ? 'https://untitledone.nl'
    : (env().NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  const fullUrl = `${siteUrl}/share/${link.token}`;

  return NextResponse.json({
    id: link.id,
    url: fullUrl,
    token: link.token,
    expires_at: link.expires_at,
    created_at: link.created_at,
  }, { status: 201 });
}

/**
 * GET /api/projects/[id]/share-links
 * 
 * List all share links for a project
 * Returns all links (active, expired, used, revoked)
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Validate project ID
  const { id } = await params;
  const paramValidation = paramsSchema.safeParse({ id });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const projectId = paramValidation.data.id;

  // Fetch all share links (RLS handles access control)
  const { data: links, error } = await (supabase as SupabaseClient)
    .from("project_share_links")
    .select(`
      id,
      token,
      created_by,
      expires_at,
      used_by,
      used_at,
      revoked,
      created_at,
      profiles!project_share_links_created_by_fkey (
        id,
        username,
        display_name
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch share links:", error);
    return NextResponse.json({ error: "Failed to fetch share links" }, { status: 500 });
  }

  // Enrich with full URLs and creator info - always use production URL in production
  const siteUrl = process.env.NODE_ENV === 'production'
    ? 'https://untitledone.nl'
    : (env().NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

  const enriched = (links || []).map((link) => ({
    id: link.id,
    url: `${siteUrl}/share/${link.token}`,
    token: link.token,
    created_by: link.created_by,
    creator_name: (link.profiles as Array<{ display_name?: string | null; username?: string | null }>)?.[0]?.display_name || (link.profiles as Array<{ display_name?: string | null; username?: string | null }>)?.[0]?.username || "Unknown",
    expires_at: link.expires_at,
    used_by: link.used_by,
    used_at: link.used_at,
    revoked: link.revoked,
    created_at: link.created_at,
  }));

  return NextResponse.json(enriched, { status: 200 });
}

