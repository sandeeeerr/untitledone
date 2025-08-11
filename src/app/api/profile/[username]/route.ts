import { NextResponse } from "next/server";
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

  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, location, avatar_url, website")
    .eq("username", username)
    .limit(1)
    .single();

  if (error) {
    // If no rows, return 404
    if ((error as { code?: string }).code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
} 