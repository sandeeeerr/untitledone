import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";
import { getMaxUserStorageBytes } from "@/lib/env";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch sizes of files uploaded by this user and sum them
    const { data, error: filesError } = await supabase
      .from("project_files")
      .select("file_size")
      .eq("uploaded_by", user.id);
    if (filesError) {
      return NextResponse.json({ error: "Failed to compute usage" }, { status: 500 });
    }

    const usedBytes = (data || []).reduce((acc, row) => {
      const size = Number((row as { file_size: number }).file_size || 0);
      return acc + (Number.isFinite(size) && size > 0 ? size : 0);
    }, 0);

    const maxBytes = getMaxUserStorageBytes();
    const remainingBytes = Math.max(0, maxBytes - usedBytes);
    const percent = maxBytes > 0 ? Math.min(100, Math.round((usedBytes / maxBytes) * 100)) : 0;

    return NextResponse.json({
      bytesUsed: usedBytes,
      bytesMax: maxBytes,
      bytesRemaining: remainingBytes,
      mbUsed: Math.round(usedBytes / (1024 * 1024)),
      mbMax: Math.round(maxBytes / (1024 * 1024)),
      mbRemaining: Math.round(remainingBytes / (1024 * 1024)),
      percentUsed: percent,
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


