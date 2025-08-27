import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const listQuerySchema = z.object({
  activityChangeId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  fileId: z.string().uuid().optional(),
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
  fileId: z.string().uuid().optional(),
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

  return NextResponse.json(created, { status: 201 });
}


