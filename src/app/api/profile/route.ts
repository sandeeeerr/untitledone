import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";

const MAX_DISPLAY_NAME = 120;
const MAX_LOCATION = 120;
const MAX_BIO = 1000;

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, location")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(req: Request) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = body as Partial<{
    display_name: string | null;
    bio: string | null;
    location: string | null;
  }>;

  const errors: string[] = [];
  if (typeof input.display_name !== "undefined" && input.display_name !== null && input.display_name.length > MAX_DISPLAY_NAME) {
    errors.push(`display_name must be at most ${MAX_DISPLAY_NAME} characters`);
  }
  if (typeof input.location !== "undefined" && input.location !== null && input.location.length > MAX_LOCATION) {
    errors.push(`location must be at most ${MAX_LOCATION} characters`);
  }
  if (typeof input.bio !== "undefined" && input.bio !== null && input.bio.length > MAX_BIO) {
    errors.push(`bio must be at most ${MAX_BIO} characters`);
  }

  if (errors.length) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const update = {
    display_name: typeof input.display_name === "string" ? input.display_name : input.display_name === null ? null : undefined,
    bio: typeof input.bio === "string" ? input.bio : input.bio === null ? null : undefined,
    location: typeof input.location === "string" ? input.location : input.location === null ? null : undefined,
  } as const;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("id, username, display_name, bio, location")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete socials first (if table exists)
  const { error: socialsError } = await (supabase as any)
    .from("profile_socials")
    .delete()
    .eq("profile_id", user.id);
  if (socialsError && socialsError.code !== "42P01") {
    // Ignore table not found; otherwise error
    return NextResponse.json({ error: socialsError.message }, { status: 500 });
  }

  const { error: delError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({}, { status: 204 });
} 