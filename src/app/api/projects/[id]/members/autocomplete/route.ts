import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const querySchema = z.object({
  q: z.string().max(50, "Query too long").optional(),
});

/**
 * GET /api/projects/[id]/members/autocomplete?q=[query]
 *
 * Autocomplete endpoint for @mention suggestions
 * Returns up to 10 project members whose usernames match the query
 * If query is empty, returns all project members
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
      { error: queryValidation.error.issues[0]?.message || "Invalid query" },
      { status: 400 }
    );
  }

  const projectId = paramValidation.data.id;
  const query = queryValidation.data.q?.toLowerCase() || "";

  // Single query to verify access and get project owner in one go
  const { data: project } = await (supabase as SupabaseClient)
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.owner_id === user.id;

  // If not owner, verify membership
  if (!isOwner) {
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

  // Optimized: Single query to get all project members with their profiles
  // This joins project_members with profiles in one DB round-trip
  const { data: members } = await (supabase as SupabaseClient)
    .from("project_members")
    .select("profiles!inner(id, username)")
    .eq("project_id", projectId);

  // Collect all user IDs: owner + members
  const allUserIds = new Set<string>([project.owner_id]);
  if (members) {
    members.forEach((member) => {
      const profile = member.profiles as unknown as { id: string; username: string };
      if (profile?.id) {
        allUserIds.add(profile.id);
      }
    });
  }

  // Query profiles for all project users (owner + members) matching the search query
  let profilesQuery = (supabase as SupabaseClient)
    .from("profiles")
    .select("id, username")
    .in("id", Array.from(allUserIds));

  if (query) {
    profilesQuery = profilesQuery.ilike("username", `%${query}%`);
  }

  const { data: matchingProfiles, error } = await profilesQuery.limit(10);

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

