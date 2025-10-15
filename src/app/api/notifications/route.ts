import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type NotificationWithRelations = {
  id: string;
  user_id: string;
  type: string;
  comment_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  project_comments: {
    id: string;
    comment: string;
    user_id: string;
    project_id: string;
    file_id: string | null;
    version_id: string | null;
    timestamp_ms: number | null;
  }[];
  projects: {
    id: string;
    name: string;
  }[];
};

const querySchema = z.object({
  filter: z.enum(["unread", "all"]).optional().default("all"),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  cursor: z.string().datetime().optional(), // ISO timestamp for created_at cursor
});

/**
 * GET /api/notifications
 * 
 * List notifications for the authenticated user
 * Supports filtering by read/unread status and pagination
 * 
 * Query params:
 * - filter: "unread" | "all" (default: "all")
 * - limit: number (max 100, default: 20)
 * - cursor: ISO timestamp for pagination
 */
export async function GET(req: Request) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Validate query parameters
  const url = new URL(req.url);
  const queryValidation = querySchema.safeParse({
    filter: url.searchParams.get("filter") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });

  if (!queryValidation.success) {
    return NextResponse.json(
      { error: queryValidation.error.issues[0]?.message || "Invalid query" },
      { status: 400 }
    );
  }

  const { filter, limit, cursor } = queryValidation.data;

  // Build query with explicit joins
  let query = (supabase as SupabaseClient)
    .from("notifications")
    .select(`
      id,
      user_id,
      type,
      comment_id,
      project_id,
      is_read,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Apply filter
  if (filter === "unread") {
    query = query.eq("is_read", false);
  }

  // Apply cursor for pagination
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  if (!notifications || notifications.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // Get unique comment and project IDs
  const commentIds = notifications.map(n => n.comment_id).filter((id): id is string => !!id);
  const projectIds = notifications.map(n => n.project_id).filter((id): id is string => !!id);

  // Fetch comments data
  const { data: comments } = await (supabase as SupabaseClient)
    .from("project_comments")
    .select("id, comment, user_id, project_id, file_id, version_id, timestamp_ms")
    .in("id", commentIds);

  // Fetch projects data
  const { data: projects } = await (supabase as SupabaseClient)
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  // Get commenter profiles
  const commenterIds = comments?.map(c => c.user_id).filter((id): id is string => !!id) || [];
  const uniqueCommenterIds = [...new Set(commenterIds)];
  const commentersMap = new Map<string, {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>();

  if (uniqueCommenterIds.length > 0) {
    const { data: commenters } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", uniqueCommenterIds);

    if (commenters) {
      commenters.forEach((commenter) => {
        commentersMap.set(commenter.id, commenter);
      });
    }
  }

  // Create lookup maps
  const commentsMap = new Map(comments?.map(c => [c.id, c]) || []);
  const projectsMap = new Map(projects?.map(p => [p.id, p]) || []);

  // Enrich notifications with related data
  const enrichedNotifications = notifications.map((n) => {
    const comment = commentsMap.get(n.comment_id || '');
    const project = projectsMap.get(n.project_id || '');
    const commenter = comment?.user_id ? commentersMap.get(comment.user_id) : null;

    return {
      ...n,
      project_comments: comment ? [comment] : [],
      projects: project ? [project] : [],
      commenter,
    };
  });

  return NextResponse.json(enrichedNotifications, { status: 200 });
}

