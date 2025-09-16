import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

// Type for file metadata
interface FileMetadata {
  superseded_by?: string | null;
  deleted_at?: string | null;
  replaced_at?: string | null;
  [key: string]: unknown;
}

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

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

    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const projectId = validation.data.id;

    // Get all versions for this project
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

    if (!versions || versions.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Get all activity changes for these versions
    const versionIds = versions.map(v => v.id);
    const { data: activityChanges, error: activityError } = await (supabase as SupabaseClient)
      .from("activity_changes")
      .select(`
        id,
        version_id,
        type,
        description,
        author_id,
        file_id,
        created_at
      `)
      .in("version_id", versionIds)
      .order("created_at", { ascending: false });

    if (activityError) {
      console.error("Failed to fetch activity changes:", activityError);
      return NextResponse.json(
        { error: "Failed to fetch activity changes" },
        { status: 500 }
      );
    }

    // Get all files for these versions
    const { data: versionFiles, error: versionFilesError } = await (supabase as SupabaseClient)
      .from("version_files")
      .select(`
        id,
        version_id,
        file_id,
        copied_from_version_id
      `)
      .in("version_id", versionIds);

    if (versionFilesError) {
      console.error("Failed to fetch version files:", versionFilesError);
      return NextResponse.json(
        { error: "Failed to fetch version files" },
        { status: 500 }
      );
    }

    // Get file details
    // Include files referenced by version_files AND files referenced directly by activity_changes (e.g., old files after replacement)
    const vfFileIds = (versionFiles || []).map(vf => vf.file_id).filter(Boolean) as string[];
    const acFileIds = (activityChanges || []).map(ac => ac.file_id).filter(Boolean) as string[];
    const fileIds = Array.from(new Set([...(vfFileIds || []), ...(acFileIds || [])]));
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
      .in("id", fileIds);

    if (filesError) {
      console.error("Failed to fetch files:", filesError);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    // Get all user profiles
    const userIds = new Set<string>();
    for (const v of versions || []) if (v.created_by) userIds.add(v.created_by);
    for (const ac of activityChanges || []) if (ac.author_id) userIds.add(ac.author_id);
    for (const f of files || []) if (f.uploaded_by) userIds.add(f.uploaded_by);

    const { data: profiles } = await (supabase as SupabaseClient)
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", Array.from(userIds));

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, {
        name: p.display_name || p.username || "Unknown",
        avatar: p.avatar_url,
      }])
    );

    const fileMap = new Map((files || []).map(f => [f.id, f]));
    const versionFileMap = new Map();
    
    // Group files by version
    for (const vf of versionFiles || []) {
      if (!versionFileMap.has(vf.version_id)) {
        versionFileMap.set(vf.version_id, []);
      }
      versionFileMap.get(vf.version_id).push(vf);
    }

    // Helper function to format time as HH:mm
    const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    // Build the activity structure that matches your hardcoded UI
    const activityVersions = versions.map(version => {
      const versionFiles = versionFileMap.get(version.id) || [];
      const versionActivityChanges = activityChanges?.filter(ac => ac.version_id === version.id) || [];
      
      // Create microChanges from activity changes
      const microChanges = versionActivityChanges.map(ac => {
        const file = ac.file_id ? fileMap.get(ac.file_id) : null;
        const replacedBy = file?.metadata && typeof file.metadata === 'object' ? (file.metadata as FileMetadata).superseded_by ?? null : null;
        const author = profileMap.get(ac.author_id) || { name: "Unknown", avatar: null };
        
        // Detect deletion entries and extract filename from description pattern "Deleted file: <name>"
        const deletionMatch = /^Deleted file:\s*(.+)$/i.exec(ac.description || "");
        const isDeletion = ac.type === 'deletion' || Boolean(deletionMatch);
        const deletionFilename = deletionMatch?.[1]?.trim();
        return {
          id: ac.id,
          type: (isDeletion ? 'deletion' : ac.type) as "addition" | "feedback" | "update" | "deletion",
          description: isDeletion ? 'Deleted file:' : ac.description,
          author: author.name,
          authorId: ac.author_id,
          time: formatTime(ac.created_at),
          fullTimestamp: ac.created_at, // Add full timestamp for proper sorting
          avatar: author.avatar,
          filename: isDeletion ? (deletionFilename || file?.filename) : file?.filename,
          fileId: ac.file_id ?? null,
          fileReplaced: Boolean(replacedBy),
          replacedByFileId: replacedBy,
        };
      });

      // Always add version creation entry first
      const versionAuthor = profileMap.get(version.created_by) || { name: "Unknown", avatar: null };
      const versionCreationEntry = {
        id: `version-${version.id}`,
        type: "addition" as const,
        description: `Version ${version.version_name} created`,
        author: versionAuthor.name,
        authorId: version.created_by,
        time: formatTime(version.created_at),
        fullTimestamp: version.created_at, // Add full timestamp for proper sorting
        avatar: versionAuthor.avatar,
        filename: undefined,
        fileId: null,
        fileReplaced: false,
        replacedByFileId: null,
      };
      
      // Only add if not already present (to avoid duplicates)
      if (!microChanges.some(mc => mc.id === `version-${version.id}`)) {
        microChanges.unshift(versionCreationEntry); // Add at the beginning
      }

      // Add file additions if there are files but no activity changes for them
      for (const vf of versionFiles) {
        const file = fileMap.get(vf.file_id);
        if (file && !microChanges.some(mc => mc.filename === file.filename)) {
          const author = profileMap.get(file.uploaded_by) || { name: "Unknown", avatar: null };
          const replacedBy = file?.metadata && typeof file.metadata === 'object' ? (file.metadata as FileMetadata).superseded_by ?? null : null;
          microChanges.push({
            id: `file-${vf.id}`,
            type: "addition" as const,
            description: `File uploaded: ${file.filename}`,
            author: author.name,
            authorId: file.uploaded_by,
            time: formatTime(file.uploaded_at),
            fullTimestamp: file.uploaded_at, // Add full timestamp for proper sorting
            avatar: author.avatar,
            filename: file.filename,
            fileId: file.id,
            fileReplaced: Boolean(replacedBy),
            replacedByFileId: replacedBy,
          });
        }
      }

      const author = profileMap.get(version.created_by) || { name: "Unknown", avatar: null };
      
      return {
        id: version.id,
        version: version.version_name,
        description: version.description,
        author: author.name,
        date: version.created_at,
        avatar: author.avatar,
        microChanges: microChanges.sort((a, b) => {
          // Sort by full timestamp (ISO string), newest first
          return new Date(b.fullTimestamp).getTime() - new Date(a.fullTimestamp).getTime();
        }),
        isActive: version.is_active,
      };
    });

    return NextResponse.json(activityVersions, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in activity route:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const payloadSchema = z.object({
      versionId: z.string().uuid(),
      description: z.string().trim().max(4000).optional(),
    });
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { versionId, description } = parsed.data;

    // Insert feedback activity change (general comment placeholder)
    const { data, error } = await (supabase as SupabaseClient)
      .from("activity_changes")
      .insert({
        version_id: versionId,
        type: "feedback",
        description: (description || "").replace(/[\u0000-\u001F\u007F]/g, ""),
        author_id: user.id,
        file_id: null,
      })
      .select("id, version_id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to create feedback change" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, version_id: data.version_id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
