import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  changeId: z.string().uuid("Invalid change ID"),
});

const updateBodySchema = z.object({
  description: z.string().trim().max(4000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; changeId: string }> }) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id, changeId } = await params;
  const parsedParams = paramsSchema.safeParse({ id, changeId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsedBody = updateBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof parsedBody.data.description !== "undefined") {
    updates.description = parsedBody.data.description.replace(/[\u0000-\u001F\u007F]/g, "");
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Only allow updating own feedback changes
  const { data, error } = await (supabase as SupabaseClient)
    .from("activity_changes")
    .update(updates)
    .eq("id", parsedParams.data.changeId)
    .eq("author_id", user.id)
    .select("id, description")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; changeId: string }> }) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id, changeId } = await params;
  const parsedParams = paramsSchema.safeParse({ id, changeId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { data, error } = await (supabase as SupabaseClient)
    .from("activity_changes")
    .delete()
    .eq("id", parsedParams.data.changeId)
    .eq("author_id", user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}


