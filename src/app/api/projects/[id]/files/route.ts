import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const uploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  fileSize: z.number().positive("File size must be positive"),
  fileType: z.string().min(1, "File type is required"),
  // kept for backwards compatibility; ignored in new schema where versions are separate
  version: z.number().int().positive("Version must be a positive integer").optional(),
  description: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Params validation
    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const projectId = validation.data.id;

    // Check if user has access to this project
    const { data: project, error: projectError } = await (supabase as SupabaseClient)
      .from("projects")
      .select("id, is_private, owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check access: public project or user is owner/member
    if (project.is_private) {
      const { data: membership } = await (supabase as SupabaseClient)
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single();

      if (!membership && project.owner_id !== user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const input = uploadSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid input", details: input.error.issues },
        { status: 400 }
      );
    }

    // For now, we'll just create a database record
    // TODO: Implement actual file storage (Supabase Storage)
    const { data: fileRecord, error: insertError } = await (supabase as SupabaseClient)
      .from("project_files")
      .insert({
        project_id: projectId,
        filename: input.data.filename,
        file_path: `/uploads/${projectId}/${input.data.filename}`, // Placeholder path
        file_size: input.data.fileSize,
        file_type: input.data.fileType,
        uploaded_by: user.id,
        metadata: {
          description: input.data.description || null,
          uploaded_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert file record:", insertError);
      return NextResponse.json(
        { error: "Failed to save file record" },
        { status: 500 }
      );
    }

    // Try to link file to the active project version if it exists
    try {
      const { data: activeVersion } = await (supabase as SupabaseClient)
        .from("project_versions")
        .select("id")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .maybeSingle();

      if (activeVersion?.id) {
        await (supabase as SupabaseClient)
          .from("version_files")
          .insert({ version_id: activeVersion.id, file_id: fileRecord.id });
      }
    } catch (linkErr) {
      console.warn("Failed to link file to active version (non-fatal):", linkErr);
    }

    return NextResponse.json({
      id: fileRecord.id,
      filename: fileRecord.filename,
      uploaded_at: fileRecord.uploaded_at,
    }, { status: 201 });

  } catch (error) {
    console.error("Unexpected error in file upload route:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Params validation
    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const projectId = validation.data.id;

    // Get files for this project (RLS will handle access control)
    const { data: files, error: filesError } = await (supabase as SupabaseClient)
      .from("project_files")
      .select(`
        id,
        filename,
        file_size,
        file_type,
        uploaded_at,
        uploaded_by,
        metadata
      `)
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });

    if (filesError) {
      console.error("Failed to fetch files:", filesError);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    // Get mapping from file -> version name
    const fileIds = Array.from(new Set(files?.map(f => f.id) || []));
    const { data: versionLinks } = await (supabase as SupabaseClient)
      .from("version_files")
      .select("file_id, version_id")
      .in("file_id", fileIds);

    const versionIds = Array.from(new Set((versionLinks || []).map(v => v.version_id)));
    const { data: versions } = await (supabase as SupabaseClient)
      .from("project_versions")
      .select("id, version_name")
      .in("id", versionIds);

    const fileIdToVersionName = new Map<string, string>();
    const versionMap = new Map((versions || []).map(v => [v.id, v.version_name] as const));
    (versionLinks || []).forEach(link => {
      const vname = versionMap.get(link.version_id);
      if (vname) fileIdToVersionName.set(link.file_id, vname);
    });

    // Get user profiles for the uploaded_by field
    const userIds = Array.from(new Set(files?.map(f => f.uploaded_by).filter(Boolean) || []));
    const { data: profiles } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, {
        name: p.display_name || p.username || "Unknown",
        avatar: p.avatar_url,
      }])
    );

    // Enrich files with profile data
    const enrichedFiles = (files || []).map(file => ({
      id: file.id,
      filename: file.filename,
      fileSize: file.file_size,
      fileType: file.file_type,
      versionName: fileIdToVersionName.get(file.id) || "",
      uploadedAt: file.uploaded_at,
      uploadedBy: profileMap.get(file.uploaded_by) || { name: "Unknown", avatar: null },
      description: file.metadata?.description || null,
    }));

    return NextResponse.json(enrichedFiles, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in files list route:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
