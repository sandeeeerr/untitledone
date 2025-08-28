import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

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
