import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { getSignedDownloadUrl, replaceObject, removeObject } from "@/lib/supabase/storage";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  fileId: z.string().uuid("Invalid file ID"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id, fileId } = await params;
    const validation = paramsSchema.safeParse({ id, fileId });
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { id: projectId, fileId: validFileId } = validation.data;

    // Check if user has access to the project
    const { data: project, error: projectError } = await (supabase as SupabaseClient)
      .from("projects")
      .select("id, name, is_private, owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access permissions
    if (project.is_private && project.owner_id !== user.id) {
      const { data: membership } = await (supabase as SupabaseClient)
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get file details
    const { data: file, error: fileError } = await (supabase as SupabaseClient)
      .from("project_files")
      .select("id, filename, file_path, file_size, file_type, uploaded_at, uploaded_by, metadata")
      .eq("id", validFileId)
      .eq("project_id", projectId)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get version mapping and metadata (no 'any' usage)
    const { data: versionFile } = await (supabase as SupabaseClient)
      .from("version_files")
      .select("version_id")
      .eq("file_id", validFileId)
      .single();

    type VersionMeta = { id: string; version_name: string; description: string | null };
    const VersionSchema = z.object({
      id: z.string().uuid(),
      version_name: z.string(),
      description: z.string().nullable().optional(),
    });

    let versionMeta: VersionMeta | null = null;
    if (versionFile?.version_id) {
      const { data: pv } = await (supabase as SupabaseClient)
        .from("project_versions")
        .select("id, version_name, description")
        .eq("id", versionFile.version_id as string)
        .maybeSingle();
      if (pv) {
        const parsed = VersionSchema.safeParse(pv);
        if (parsed.success) {
          versionMeta = {
            id: parsed.data.id,
            version_name: parsed.data.version_name,
            description: parsed.data.description ?? null,
          };
        }
      }
    }

    // Get uploader profile
    const { data: uploaderProfile } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .eq("id", file.uploaded_by)
      .single();

    // Enrich file data
    const enrichedFile = {
      id: file.id,
      filename: file.filename,
      filePath: file.file_path,
      fileSize: file.file_size,
      fileType: file.file_type,
      uploadedAt: file.uploaded_at,
      uploadedBy: {
        id: file.uploaded_by,
        name: uploaderProfile?.display_name || uploaderProfile?.username || "Unknown",
        username: uploaderProfile?.username || null,
        avatar: uploaderProfile?.avatar_url || null,
      },
      description: file.metadata?.description || null,
      version: versionMeta ? {
        id: versionMeta.id,
        name: versionMeta.version_name,
        description: versionMeta.description,
      } : null,
      project: {
        id: project.id,
        name: project.name,
      },
    };

    return NextResponse.json(enrichedFile, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in file detail route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Minimal actions endpoint for download/replace/delete using query param `action`
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id, fileId } = await params;
    const validation = paramsSchema.safeParse({ id, fileId });
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    const { id: projectId, fileId: validFileId } = validation.data;

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    // Load project and file
    const { data: project } = await (supabase as SupabaseClient)
      .from("projects")
      .select("id, owner_id, is_private, downloads_enabled")
      .eq("id", projectId)
      .single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.is_private && project.owner_id !== user.id) {
      const { data: membership } = await (supabase as SupabaseClient)
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membership) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: file } = await (supabase as SupabaseClient)
      .from("project_files")
      .select("id, file_path, filename, uploaded_by")
      .eq("id", validFileId)
      .eq("project_id", projectId)
      .single();
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (action === "download") {
      if (!project.downloads_enabled) return NextResponse.json({ error: "Downloads disabled" }, { status: 403 });
      const signed = await getSignedDownloadUrl(file.file_path, 60 * 5);
      return NextResponse.json({ url: signed }, { status: 200 });
    }

    if (action === "replace") {
      if (!(project.owner_id === user.id || file.uploaded_by === user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const form = await req.formData().catch(() => null);
      const newFile = form?.get("file");
      if (!(newFile instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
      await replaceObject(file.file_path, newFile);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (action === "delete") {
      if (!(project.owner_id === user.id || file.uploaded_by === user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await removeObject(file.file_path).catch(() => {});
      await (supabase as SupabaseClient).from("project_files").delete().eq("id", validFileId).eq("project_id", projectId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Unexpected error in file action route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
