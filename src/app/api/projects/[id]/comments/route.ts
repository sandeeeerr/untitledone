import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parseMentions, validateMentions, createMentionNotifications } from "@/lib/utils/mentions";
import { sendMentionEmail } from "@/lib/api/emails";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const listQuerySchema = z.object({
  activityChangeId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  fileId: z.string().min(1).optional(), // Support both UUIDs and external IDs (Google Drive, Dropbox)
  limit: z.coerce.number().int().positive().max(200).optional(),
  cursor: z.string().datetime().optional(), // ISO timestamp for created_at cursor
  countOnly: z.coerce.boolean().optional(),
  scope: z.enum(["general"]).optional(),
});

const createBodySchema = z.object({
  comment: z.string().min(1, "Comment is required").max(4000),
  parentId: z.string().uuid().optional(),
  activityChangeId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  fileId: z.string().min(1).optional(), // Support both UUIDs and external IDs (Google Drive, Dropbox)
  timestampMs: z.number().nonnegative().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  // Auth is optional for GET (public projects visible via RLS for anon)
  await supabase.auth.getUser().catch(() => null);

  const { id } = await params;
  const paramValidation = paramsSchema.safeParse({ id });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const url = new URL(req.url);
  const queryValidation = listQuerySchema.safeParse({
    activityChangeId: url.searchParams.get("activityChangeId") ?? undefined,
    versionId: url.searchParams.get("versionId") ?? undefined,
    fileId: url.searchParams.get("fileId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    countOnly: url.searchParams.get("countOnly") ?? undefined,
    scope: url.searchParams.get("scope") ?? undefined,
  });
  if (!queryValidation.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { activityChangeId, versionId, fileId, limit = 20, cursor, countOnly, scope } = queryValidation.data;

  const definedContexts = [activityChangeId, versionId, fileId].filter((v) => !!v);
  if (definedContexts.length !== 1) {
    return NextResponse.json({ error: "Provide exactly one context: activityChangeId, versionId or fileId" }, { status: 400 });
  }

  const table = (supabase as SupabaseClient).from("project_comments");
  if (countOnly) {
    let countQuery = table
      .select("id", { count: "exact", head: true })
      .eq("project_id", paramValidation.data.id);
    if (activityChangeId) countQuery = countQuery.eq("activity_change_id", activityChangeId);
    if (versionId) countQuery = countQuery.eq("version_id", versionId);
    if (fileId) countQuery = countQuery.eq("file_id", fileId);
    if (scope === "general") {
      countQuery = countQuery.is("activity_change_id", null).is("file_id", null);
    }
    const { count, error: countError } = await countQuery;
    if (countError) {
      return NextResponse.json({ error: "Failed to count comments" }, { status: 500 });
    }
    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
  }

  let query = table
    .select(
      `id, project_id, parent_id, activity_change_id, version_id, file_id, user_id, comment, created_at, updated_at, edited, resolved, timestamp_ms,
       profiles!project_comments_user_id_fkey(id, username, display_name, avatar_url)`,
    )
    .eq("project_id", paramValidation.data.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (activityChangeId) query = query.eq("activity_change_id", activityChangeId);
  if (versionId) query = query.eq("version_id", versionId);
  if (fileId) query = query.eq("file_id", fileId);
  if (scope === "general") {
    query = query.is("activity_change_id", null).is("file_id", null);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const paramValidation = paramsSchema.safeParse({ id });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const input = parsed.data;
  
  // Enforce exactly one context for a thread
  const definedContexts = [input.activityChangeId, input.versionId, input.fileId].filter((v) => !!v);
  if (definedContexts.length !== 1) {
    return NextResponse.json({ error: "Provide exactly one context: activityChangeId, versionId or fileId" }, { status: 400 });
  }

  // Sanitize basic control chars and trim
  const sanitizedComment = input.comment.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (sanitizedComment.length === 0) {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  }

  // Insert comment; rely on RLS to validate public/private rules
  const { data: created, error: insertError } = await (supabase as SupabaseClient)
    .from("project_comments")
    .insert({
      project_id: paramValidation.data.id,
      user_id: user.id,
      comment: sanitizedComment,
      parent_id: input.parentId ?? null,
      activity_change_id: input.activityChangeId ?? null,
      version_id: input.versionId ?? null,
      file_id: input.fileId ?? null,
      timestamp_ms: input.timestampMs ?? null,
    })
    .select(
      `id, project_id, parent_id, activity_change_id, version_id, file_id, user_id, comment, created_at, updated_at, edited, resolved, timestamp_ms,
       profiles!project_comments_user_id_fkey(id, username, display_name, avatar_url)`,
    )
    .single();

  if (insertError || !created) {
    return NextResponse.json({ error: insertError?.message || "Failed to create comment" }, { status: 500 });
  }

  // Process @mentions in the comment (non-blocking, best-effort)
  try {
    // Skip mention processing if comment is resolved
    if (!created.resolved) {
      // Parse mentions from comment text
      const mentionedUsernames = parseMentions(sanitizedComment);
      
      if (mentionedUsernames.length > 0) {
        // Validate that mentioned users are project members
        const validUsers = await validateMentions(
          mentionedUsernames,
          paramValidation.data.id,
          supabase as SupabaseClient
        );

        if (validUsers.length > 0) {
          const mentionedUserIds = validUsers.map((u) => u.id);

          // Create mention records and notifications (filters out self-mentions internally)
          // Use service client to bypass RLS for system-level notification creation
          const serviceClient = createServiceClient();
          await createMentionNotifications(
            created.id,
            mentionedUserIds,
            user.id,
            paramValidation.data.id,
            serviceClient as SupabaseClient
          );

          // Send instant emails to users with instant email preference enabled (non-blocking)
          // Don't await - fire and forget to not slow down comment creation
          sendInstantMentionEmails(
            mentionedUserIds,
            user.id,
            paramValidation.data.id,
            created.id,
            sanitizedComment,
            supabase as SupabaseClient
          ).catch((err) => {
            console.error("Failed to send instant mention emails:", err);
          });
        }
      }
    }
  } catch (mentionError) {
    // Log error but don't fail comment creation
    console.error("Failed to process mentions:", mentionError);
  }

  // If this is a head comment on a file (no parent, file context), create an activity change for it
  try {
    const isHeadFileComment = Boolean(input.fileId) && !input.parentId && !input.activityChangeId;
    if (isHeadFileComment) {
      // Resolve version_id for the file. Prefer linked version via version_files; fall back to most recent/active version.
      let versionId: string | null = null;
      const { data: vf } = await (supabase as SupabaseClient)
        .from("version_files")
        .select("version_id")
        .eq("file_id", input.fileId!)
        .single();
      if (vf?.version_id) {
        versionId = vf.version_id as string;
      } else {
        const { data: pv } = await (supabase as SupabaseClient)
          .from("project_versions")
          .select("id, is_active, created_at")
          .eq("project_id", paramValidation.data.id)
          .order("is_active", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        versionId = pv?.id ?? null;
      }

      if (versionId) {
        // Create the activity change linked to the file
        const { data: ac, error: acError } = await (supabase as SupabaseClient)
          .from("activity_changes")
          .insert({
            version_id: versionId,
            type: "feedback",
            description: sanitizedComment,
            author_id: user.id,
            file_id: input.fileId!,
          })
          .select("id")
          .single();

        if (!acError && ac?.id) {
          // Link the comment to the activity change for traceability
          await (supabase as SupabaseClient)
            .from("project_comments")
            .update({ activity_change_id: ac.id })
            .eq("id", created.id);
        }
      }
    }
  } catch (e) {
    // Best-effort: do not fail the comment creation if activity linkage fails
    console.error("Failed to create activity change for file head comment:", e);
  }

  return NextResponse.json(created, { status: 201 });
}

/**
 * Helper function to send instant mention emails
 * Checks user preferences and sends emails to users with instant email enabled
 */
async function sendInstantMentionEmails(
  mentionedUserIds: string[],
  authorId: string,
  projectId: string,
  commentId: string,
  commentText: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Filter out author from recipients
    const recipientIds = mentionedUserIds.filter((id) => id !== authorId);
    
    if (recipientIds.length === 0) {
      return;
    }

    // Fetch user preferences for mentioned users
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("user_id, email_mentions_enabled, email_frequency")
      .in("user_id", recipientIds);

    // Filter to only users with instant email enabled
    const instantEmailUserIds = (preferences || [])
      .filter((pref) => pref.email_mentions_enabled && pref.email_frequency === "instant")
      .map((pref) => pref.user_id);

    if (instantEmailUserIds.length === 0) {
      return;
    }

    // Fetch recipient profiles (email, username, display_name)
    const { data: recipients } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", instantEmailUserIds);

    // Fetch user emails from auth.users (need service role for this)
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailMap = new Map<string, string>();
    authUsers.users.forEach((authUser) => {
      if (authUser.email) {
        emailMap.set(authUser.id, authUser.email);
      }
    });

    // Fetch project info
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    // Fetch commenter info (author)
    const { data: commenter } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", authorId)
      .single();

    if (!project || !commenter) {
      console.error("Missing project or commenter data for email");
      return;
    }

    const commenterName = commenter.display_name || commenter.username || "Someone";
    const siteUrl = env().NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const linkUrl = `${siteUrl}/projects/${projectId}?comment=${commentId}&highlight=true`;

    // Send email to each recipient
    const emailPromises = (recipients || []).map(async (recipient) => {
      const recipientEmail = emailMap.get(recipient.id);
      if (!recipientEmail) {
        console.warn(`No email found for user ${recipient.id}`);
        return;
      }

      const recipientName = recipient.display_name || recipient.username || "there";

      try {
        await sendMentionEmail(
          recipientEmail,
          recipientName,
          project.name,
          commentText,
          linkUrl,
          commenterName
        );
      } catch (emailError) {
        console.error(`Failed to send email to ${recipientEmail}:`, emailError);
        // Continue with other emails even if one fails
      }
    });

    // Wait for all emails (with individual error handling)
    await Promise.allSettled(emailPromises);
  } catch (error) {
    console.error("Error in sendInstantMentionEmails:", error);
    // Don't throw - this is best-effort
  }
}


