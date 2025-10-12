import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const updateBodySchema = z.object({
  email_mentions_enabled: z.boolean(),
  in_app_mentions_enabled: z.boolean(),
  email_frequency: z.enum(["instant", "daily"]),
});

/**
 * GET /api/notifications/preferences
 * 
 * Get notification preferences for the authenticated user
 * Returns default values if preferences don't exist yet
 */
export async function GET(_req: Request) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Fetch user preferences (RLS ensures user can only read their own)
  const { data, error } = await (supabase as SupabaseClient)
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no preferences exist yet, return defaults
    if (error.code === "PGRST116") {
      return NextResponse.json({
        email_mentions_enabled: true,
        in_app_mentions_enabled: true,
        email_frequency: "daily",
      }, { status: 200 });
    }
    
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }

  return NextResponse.json({
    email_mentions_enabled: data.email_mentions_enabled,
    in_app_mentions_enabled: data.in_app_mentions_enabled,
    email_frequency: data.email_frequency,
  }, { status: 200 });
}

/**
 * PUT /api/notifications/preferences
 * 
 * Update notification preferences for the authenticated user
 * Creates preferences if they don't exist (upsert)
 */
export async function PUT(req: Request) {
  const supabase = await createServerClient();
  
  // Require authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
      { error: bodyValidation.error.issues[0]?.message || "Invalid payload" },
      { status: 400 }
    );
  }

  const { email_mentions_enabled, in_app_mentions_enabled, email_frequency } = bodyValidation.data;

  // Upsert preferences (RLS ensures user can only update their own)
  const { data, error } = await (supabase as SupabaseClient)
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      email_mentions_enabled,
      in_app_mentions_enabled,
      email_frequency,
    }, {
      onConflict: "user_id",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }

  return NextResponse.json({
    email_mentions_enabled: data.email_mentions_enabled,
    in_app_mentions_enabled: data.in_app_mentions_enabled,
    email_frequency: data.email_frequency,
  }, { status: 200 });
}

