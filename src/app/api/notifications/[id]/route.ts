import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
});

const updateBodySchema = z.object({
  is_read: z.boolean(),
});

/**
 * PATCH /api/notifications/[id]
 * 
 * Update a notification (mark as read/unread)
 * Only the notification owner can update their notifications
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const { id } = await params;
  const paramValidation = paramsSchema.safeParse({ id });
  if (!paramValidation.success) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  // Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bodyValidation = updateBodySchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      { error: bodyValidation.error.errors[0]?.message || "Invalid payload" },
      { status: 400 }
    );
  }

  // Update notification (RLS ensures user can only update their own)
  const { data, error } = await (supabase as SupabaseClient)
    .from("notifications")
    .update({ is_read: bodyValidation.data.is_read })
    .eq("id", paramValidation.data.id)
    .eq("user_id", user.id) // Extra check for security
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

