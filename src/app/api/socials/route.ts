import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await (supabase as any)
    .from("profile_socials")
    .select("platform, url")
    .eq("profile_id", user.id)
    .order("platform", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function PUT(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = body as Partial<{ links: Array<{ platform?: string; url?: string }> }>;
  const links = Array.isArray(input.links) ? input.links : [];

  const allowed = new Set([
    "soundcloud",
    "spotify",
    "youtube",
    "instagram",
    "tiktok",
    "x",
    "facebook",
    "twitch",
    "bandcamp",
    "mixcloud",
  ]);

  const sanitized = links
    .filter((l) => l && typeof l.platform === "string" && typeof l.url === "string")
    .map((l) => ({ platform: String(l.platform), url: String(l.url) }))
    .filter((l) => allowed.has(l.platform) && l.url.length > 0 && l.url.length <= 255);

  const dedupMap = new Map<string, string>();
  for (const l of sanitized) dedupMap.set(l.platform, l.url);
  const deduped = Array.from(dedupMap.entries()).map(([platform, url]) => ({ platform, url }));

  const { error: delError } = await (supabase as any)
    .from("profile_socials")
    .delete()
    .eq("profile_id", user.id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (deduped.length > 0) {
    const rows = deduped.map((l) => ({ profile_id: user.id, platform: l.platform, url: l.url }));
    const { error: insError } = await (supabase as any).from("profile_socials").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  const { data, error } = await (supabase as any)
    .from("profile_socials")
    .select("platform, url")
    .eq("profile_id", user.id)
    .order("platform", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? [], { status: 200 });
} 