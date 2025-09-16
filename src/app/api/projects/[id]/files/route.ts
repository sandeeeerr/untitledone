import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { uploadProjectObject } from "@/lib/supabase/storage";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const metaSchema = z.object({
  description: z.string().optional(),
  versionId: z.string().uuid().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }
    const projectId = validation.data.id;

    // Parse multipart form-data
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const description = (form.get("description") as string | null) || undefined;
    const versionIdRaw = (form.get("versionId") as string | null) || undefined;
    const meta = metaSchema.safeParse({ description, versionId: versionIdRaw });
    if (!meta.success) {
      return NextResponse.json({ error: "Invalid input", details: meta.error.issues }, { status: 400 });
    }

    // Upload to Supabase Storage (key: projectId/<uuid>-filename)
    const storageKey = await uploadProjectObject({ projectId, file });

    // Insert file metadata
    const { data: fileRecord, error: insertError } = await (supabase as SupabaseClient)
      .from("project_files")
      .insert({
        project_id: projectId,
        filename: file.name,
        file_path: storageKey,
        file_size: Number(file.size || 0),
        file_type: file.type || "application/octet-stream",
        uploaded_by: user.id,
        metadata: {
          description: meta.data.description || null,
          uploaded_at: new Date().toISOString(),
        },
      })
      .select("id, filename, uploaded_at")
      .single();

    if (insertError || !fileRecord) {
      console.error("Failed to insert file record:", insertError);
      return NextResponse.json({ error: "Failed to save file record" }, { status: 500 });
    }

    // Resolve target version (prefer provided, else active version if any)
    let resolvedVersionId: string | null = meta.data.versionId ?? null;
    if (!resolvedVersionId) {
      const { data: activeVersion, error: activeVersionError } = await (supabase as SupabaseClient)
        .from("project_versions")
        .select("id")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .maybeSingle();
      
      console.log("Active version lookup:", { activeVersion, activeVersionError, projectId });
      resolvedVersionId = activeVersion?.id ?? null;
    }

    if (resolvedVersionId) {
      console.log("Linking file to version:", { fileId: fileRecord.id, versionId: resolvedVersionId });
      
      // Link file to version
      const { error: linkError } = await (supabase as SupabaseClient)
        .from("version_files")
        .insert({ version_id: resolvedVersionId, file_id: fileRecord.id });
      
      if (linkError) {
        console.error("Failed to link file to version:", linkError);
      }

      // Log activity change (addition)
      const { error: activityError } = await (supabase as SupabaseClient)
        .from("activity_changes")
        .insert({
          version_id: resolvedVersionId,
          type: "addition",
          description: (meta.data.description?.trim() || `Uploaded ${file.name}`),
          author_id: user.id,
          file_id: fileRecord.id,
        });
        
      if (activityError) {
        console.error("Failed to create activity change:", activityError);
      }
    } else {
      console.log("No version found - file will remain unversioned");
    }

    return NextResponse.json({
      id: fileRecord.id,
      filename: fileRecord.filename,
      uploaded_at: fileRecord.uploaded_at,
      version_id: resolvedVersionId,
    }, { status: 201 });

  } catch (error) {
    console.error("Unexpected error in file upload route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }
    const projectId = validation.data.id;

    // Base files
    const { data: files, error: filesError } = await (supabase as SupabaseClient)
      .from("project_files")
      .select("id, filename, file_size, file_type, uploaded_at, uploaded_by, metadata")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });
    if (filesError) {
      console.error("Failed to fetch files:", filesError);
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }

    const fileIds = Array.from(new Set((files ?? []).map(f => f.id)));

    // version mapping
    const { data: vfiles } = await (supabase as SupabaseClient)
      .from("version_files")
      .select("file_id, version_id")
      .in("file_id", fileIds);
    const versionIds = Array.from(new Set((vfiles ?? []).map(vf => vf.version_id)));

    const { data: versions } = await (supabase as SupabaseClient)
      .from("project_versions")
      .select("id, version_name")
      .in("id", versionIds.length ? versionIds : ["00000000-0000-0000-0000-000000000000"]);
    const versionNameById = new Map<string, string>();
    for (const v of versions ?? []) versionNameById.set(v.id, v.version_name);

    const versionIdByFileId = new Map<string, string | undefined>();
    for (const vf of vfiles ?? []) versionIdByFileId.set(vf.file_id, vf.version_id);

    // Profiles for uploader
    const userIds = Array.from(new Set((files ?? []).map(f => f.uploaded_by).filter(Boolean)));
    const { data: profiles } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, { name: p.display_name || p.username || "Unknown", avatar: p.avatar_url }])
    );

    const enrichedFiles = (files || [])
      .filter((f) => {
        try {
          const meta = (f as any)?.metadata;
          return !(meta && typeof meta === 'object' && (meta as any).deleted_at);
        } catch {
          return true;
        }
      })
      .map(file => {
      const vid = versionIdByFileId.get(file.id);
      return {
        id: file.id,
        filename: file.filename,
        fileSize: file.file_size,
        fileType: file.file_type,
        uploadedAt: file.uploaded_at,
        uploadedBy: profileMap.get(file.uploaded_by) || { name: "Unknown", avatar: null },
        description: file.metadata?.description || null,
        versionName: vid ? versionNameById.get(vid) || null : null,
      };
    });

    return NextResponse.json(enrichedFiles, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in files list route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
