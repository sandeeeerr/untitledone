import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const createVersionSchema = z.object({
  version_type: z.enum(["semantic", "date", "custom"]),
  version_name: z.string().optional(), // Only required for custom type
  description: z.string().min(1, "Description is required"),
  copy_files_from_version_id: z.string().uuid().optional(),
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

    // Check if user is project owner
    const { data: project, error: projectError } = await (supabase as SupabaseClient)
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only project owners can create versions" },
        { status: 403 }
      );
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

    const input = createVersionSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid input", details: input.error.issues },
        { status: 400 }
      );
    }

    // Validate custom version name if provided
    if (input.data.version_type === "custom" && !input.data.version_name) {
      return NextResponse.json(
        { error: "Version name is required for custom type" },
        { status: 400 }
      );
    }

    // Start a transaction
    const { data: version, error: versionError } = await (supabase as SupabaseClient)
      .from("project_versions")
      .insert({
        project_id: projectId,
        version_type: input.data.version_type,
        version_name: input.data.version_name || null, // Will be auto-generated if null
        description: input.data.description,
        created_by: user.id,
        is_active: false, // New versions start as inactive
      })
      .select()
      .single();

    if (versionError) {
      console.error("Failed to create version:", versionError);
      return NextResponse.json(
        { error: "Failed to create version" },
        { status: 500 }
      );
    }

    // If copying files from another version, do that now
    if (input.data.copy_files_from_version_id) {
      const { data: sourceFiles, error: sourceError } = await (supabase as SupabaseClient)
        .from("version_files")
        .select("file_id")
        .eq("version_id", input.data.copy_files_from_version_id);

      if (sourceError) {
        console.error("Failed to fetch source files:", sourceError);
        // Continue without copying files
      } else if (sourceFiles && sourceFiles.length > 0) {
        // Copy files to new version
        const fileCopies = sourceFiles.map(sf => ({
          version_id: version.id,
          file_id: sf.file_id,
          copied_from_version_id: input.data.copy_files_from_version_id,
        }));

        const { error: copyError } = await (supabase as SupabaseClient)
          .from("version_files")
          .insert(fileCopies);

        if (copyError) {
          console.error("Failed to copy files:", copyError);
          // Continue without copying files
        }
      }
    }

    return NextResponse.json({
      id: version.id,
      version_name: version.version_name,
      description: version.description,
      version_type: version.version_type,
      created_at: version.created_at,
    }, { status: 201 });

  } catch (error) {
    console.error("Unexpected error in version creation route:", error);
    
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

    // Get versions for this project (RLS will handle access control)
    const { data: versions, error: versionsError } = await (supabase as SupabaseClient)
      .from("project_versions")
      .select(`
        id,
        version_type,
        version_name,
        description,
        created_at,
        is_active,
        created_by
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (versionsError) {
      console.error("Failed to fetch versions:", versionsError);
      return NextResponse.json(
        { error: "Failed to fetch versions" },
        { status: 500 }
      );
    }

    // Get user profiles for the created_by field
    const userIds = Array.from(new Set(versions?.map(v => v.created_by).filter(Boolean) || []));
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

    // Enrich versions with profile data and file counts
    const enrichedVersions = await Promise.all((versions || []).map(async (version) => {
      // Get file count for this version
      const { count: fileCount } = await (supabase as SupabaseClient)
        .from("version_files")
        .select("*", { count: "exact", head: true })
        .eq("version_id", version.id);

      return {
        id: version.id,
        version_type: version.version_type,
        version_name: version.version_name,
        description: version.description,
        created_at: version.created_at,
        is_active: version.is_active,
        created_by: profileMap.get(version.created_by) || { name: "Unknown", avatar: null },
        file_count: fileCount || 0,
      };
    }));

    return NextResponse.json(enrichedVersions, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in versions list route:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
