import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { getNewMentions, validateMentions, createMentionNotifications } from "@/lib/utils/mentions";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
  commentId: z.string().uuid("Invalid comment ID format"),
});

const updateBodySchema = z.object({
  comment: z.string().min(1).max(4000).optional(),
  resolved: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id, commentId } = await params;
  const paramValidation = paramsSchema.safeParse({ id, commentId });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof parsed.data.comment !== "undefined") {
    const sanitized = parsed.data.comment.trim().replace(/[\u0000-\u001F\u007F]/g, "");
    if (sanitized.length === 0) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }
    updates.comment = sanitized;
  }
  if (typeof parsed.data.resolved !== "undefined") updates.resolved = parsed.data.resolved;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Fetch old comment text if we're updating the comment content (for mention comparison)
  let oldCommentText: string | null = null;
  if (updates.comment) {
    const { data: oldComment } = await (supabase as SupabaseClient)
      .from("project_comments")
      .select("comment")
      .eq("id", paramValidation.data.commentId)
      .single();
    oldCommentText = oldComment?.comment || null;
  }

  const { data, error } = await (supabase as SupabaseClient)
    .from("project_comments")
    .update(updates)
    .eq("id", paramValidation.data.commentId)
    .eq("project_id", paramValidation.data.id)
    .select(
      "id, project_id, parent_id, activity_change_id, version_id, file_id, user_id, comment, created_at, updated_at, edited, resolved, timestamp_ms",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to update comment" }, { status: 500 });
  }

  // Process new @mentions if comment text was updated (non-blocking, best-effort)
  if (oldCommentText && updates.comment && !data.resolved) {
    try {
      const newMentionedUsernames = getNewMentions(
        updates.comment as string,
        oldCommentText
      );

      if (newMentionedUsernames.length > 0) {
        // Validate that mentioned users are project members
        const validUsers = await validateMentions(
          newMentionedUsernames,
          paramValidation.data.id,
          supabase as SupabaseClient
        );

        if (validUsers.length > 0) {
          const mentionedUserIds = validUsers.map((u) => u.id);
          
          // Create mention records and notifications for new mentions only
          await createMentionNotifications(
            data.id,
            mentionedUserIds,
            user.id,
            paramValidation.data.id,
            supabase as SupabaseClient
          );
        }
      }
    } catch (mentionError) {
      // Log error but don't fail comment update
      console.error("Failed to process new mentions on edit:", mentionError);
    }
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id, commentId } = await params;
  const paramValidation = paramsSchema.safeParse({ id, commentId });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { error } = await (supabase as SupabaseClient)
    .from("project_comments")
    .delete()
    .eq("id", paramValidation.data.commentId)
    .eq("project_id", paramValidation.data.id);

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete comment" }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}


