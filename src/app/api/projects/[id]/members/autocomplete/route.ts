import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const querySchema = z.object({
  q: z.string().min(1, "Query must be at least 1 character").max(50, "Query too long"),
});

/**
 * GET /api/projects/[id]/members/autocomplete?q=[query]
 * 
 * Autocomplete endpoint for @mention suggestions
 * Returns up to 5 project members whose usernames match the query
 * 
 * @requires Authentication - User must be a project member
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

  // Validate query parameter
  const url = new URL(req.url);
  const queryValidation = querySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!queryValidation.success) {
    return NextResponse.json(
      { error: queryValidation.error.errors[0]?.message || "Invalid query" },
      { status: 400 }
    );
  }

  const projectId = paramValidation.data.id;
  const query = queryValidation.data.q.toLowerCase();

  // Verify user has access to this project (is owner or member)
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

  // Get project owner profile
  const { data: ownerProfile } = await (supabase as SupabaseClient)
    .from("profiles")
    .select("id, username")
    .eq("id", project.owner_id)
    .single();

  // Get project members
  const { data: members } = await (supabase as SupabaseClient)
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  const memberIds = members?.map((m) => m.user_id) || [];
  
  // Collect all user IDs (owner + members)
  const allUserIds = new Set<string>();
  if (ownerProfile) {
    allUserIds.add(ownerProfile.id);
  }
  memberIds.forEach((id) => allUserIds.add(id));

  if (allUserIds.size === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // Query profiles for users matching the query
  // Use ilike for case-insensitive partial matching
  const { data: matchingProfiles, error } = await (supabase as SupabaseClient)
    .from("profiles")
    .select("id, username")
    .in("id", Array.from(allUserIds))
    .ilike("username", `%${query}%`)
    .limit(5);

  if (error) {
    console.error("Autocomplete query error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }

  // Return only id and username
  const suggestions = (matchingProfiles || []).map((profile) => ({
    id: profile.id,
    username: profile.username || "",
  }));

  return NextResponse.json(suggestions, { status: 200 });
}

