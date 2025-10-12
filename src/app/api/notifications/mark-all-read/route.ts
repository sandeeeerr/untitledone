import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * PATCH /api/notifications/mark-all-read
 * 
 * Mark all notifications as read for the authenticated user
 * This is a bulk update operation
 */
export async function PATCH(_req: Request) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Update all unread notifications to read (RLS ensures user can only update their own)
  const { error, count } = await (supabase as SupabaseClient)
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to mark all as read:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: count || 0 }, { status: 200 });
}

