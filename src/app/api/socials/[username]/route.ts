import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Find profile id by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (profileError) {
    if ((profileError as { code?: string }).code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await (supabase as SupabaseClient)
    .from("profile_socials")
    .select("platform, url")
    .eq("profile_id", profile.id)
    .order("platform", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
} 