import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";
import { uploadProjectObject, removeObject, willExceedUserQuota } from "@/lib/supabase/storage";
import { getMaxUploadFileBytes } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage/factory";
import type { StorageProviderType } from "@/lib/storage/types";

// Configure body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
    responseLimit: false,
  },
};

// Use Node.js runtime for file uploads to avoid Edge Runtime limitations
// export const runtime = 'nodejs';

// Type for file metadata
interface FileMetadata {
  superseded_by?: string | null;
  supersedes?: string | null;
  deleted_at?: string | null;
  replaced_at?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

// Type for project file with metadata
interface _ProjectFileWithMetadata {
  id: string;
  filename: string;
  file_type: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  last_activity: string;
  metadata: FileMetadata | null;
  project_id: string;
  collaboration_mode: string | null;
}

// Type for old comment
interface OldComment {
  user_id: string;
  comment: string;
  timestamp_ms: number | null;
}

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  fileId: z.string().min(1, "Invalid file ID"), // Support both UUIDs and external IDs (Google Drive, Dropbox)
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

    // Get file details - check both id and external_file_id for external storage support
    type FileRow = {
      id: string;
      filename: string;
      file_path: string;
      file_size: number;
      file_type: string;
      uploaded_at: string;
      uploaded_by: string;
      metadata: unknown;
      storage_provider: string | null;
      external_file_id: string | null;
    };
    let file: FileRow | null = null;
    let fileError: unknown = null;

    // First try by id (UUID)
    const { data: fileById } = await (supabase as SupabaseClient)
      .from("project_files")
      .select("id, filename, file_path, file_size, file_type, uploaded_at, uploaded_by, metadata, storage_provider, external_file_id")
      .eq("id", validFileId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (fileById) {
      file = fileById;
    } else {
      // If not found by id, try by external_file_id (Google Drive, Dropbox)
      const { data: fileByExternal, error: errorByExternal } = await (supabase as SupabaseClient)
        .from("project_files")
        .select("id, filename, file_path, file_size, file_type, uploaded_at, uploaded_by, metadata, storage_provider, external_file_id")
        .eq("external_file_id", validFileId)
        .eq("project_id", projectId)
        .maybeSingle();

      file = fileByExternal;
      fileError = errorByExternal;
    }

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
    const fileMetadata = file.metadata as FileMetadata | null;
    const isDeleted = Boolean(fileMetadata?.deleted_at);
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
      description: fileMetadata?.description || null,
      supersededByFileId: fileMetadata?.superseded_by ?? null,
      supersedesFileId: fileMetadata?.supersedes ?? null,
      deletedAt: isDeleted ? fileMetadata?.deleted_at ?? null : null,
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

    // If deleted, return 404 (hard-deleted rows won't reach here; this is just a guard)
    if (isDeleted) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
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
      .select("id, file_path, filename, uploaded_by, metadata, file_type, storage_provider, external_file_id")
      .eq("id", validFileId)
      .eq("project_id", projectId)
      .single();
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (action === "download") {
      // Block download if file is soft-deleted
      const fileWithMeta = file as { metadata?: { deleted_at?: string }; storage_provider?: string; external_file_id?: string };
      const isDeleted = Boolean(fileWithMeta?.metadata?.deleted_at);
      if (isDeleted) return NextResponse.json({ error: "File deleted" }, { status: 410 });
      if (!project.downloads_enabled) return NextResponse.json({ error: "Downloads disabled" }, { status: 403 });
      
      try {
        // Get storage provider using UPLOADER's userId (ownership proxying)
        const storageProvider = (fileWithMeta.storage_provider || 'local') as StorageProviderType;
        const uploadedByUserId = file.uploaded_by;
        const fileIdentifier = fileWithMeta.external_file_id || file.file_path;
        
        const adapter = await getStorageProvider(storageProvider, uploadedByUserId);
        const signedUrl = await adapter.getDownloadUrl(fileIdentifier, uploadedByUserId, 60 * 5);
        
        return NextResponse.json({ url: signedUrl }, { status: 200 });
      } catch (error) {
        console.error("Failed to generate download URL:", error);
        
        // Check for specific error codes
        if (error instanceof Error) {
          if (error.message.includes('PROVIDER_TOKEN_EXPIRED')) {
            return NextResponse.json(
              { 
                error: "File owner needs to reconnect their storage provider", 
                code: "PROVIDER_TOKEN_EXPIRED" 
              },
              { status: 401 }
            );
          }
          if (error.message.includes('PROVIDER_NOT_CONNECTED')) {
            return NextResponse.json(
              { 
                error: "File owner's storage provider is not connected", 
                code: "PROVIDER_NOT_CONNECTED" 
              },
              { status: 400 }
            );
          }
        }
        
        // Storage object missing or unauthorized
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    if (action === "replace") {
      // Allow replace if user has access to the project (owner or member)
      // This matches the upload permissions logic
      const isOwner = project.owner_id === user.id;
      let hasAccess = isOwner;
      
      if (!hasAccess) {
        if (project.is_private) {
          // For private projects, check membership
          const { data: membership } = await (supabase as SupabaseClient)
            .from("project_members")
            .select("user_id")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .maybeSingle();
          hasAccess = !!membership;
        } else {
          // For public projects, authenticated users can replace files
          hasAccess = true;
        }
      }
      
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Parse multipart form-data
      const form = await req.formData().catch(() => null);
      if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
      
      const description = (form.get("description") as string | null) || undefined;
      
      // Check if this is a metadata-only request (for large files uploaded directly to Supabase)
      const uploadedPath = form.get("uploadedPath") as string | null;
      const isMetadataOnly = !!uploadedPath;
      
      let newFile: File | null = null;
      let fileSize: number;
      let fileName: string;
      let fileType: string;
      
      if (isMetadataOnly) {
        // Large file already uploaded directly to Supabase Storage
        const sizeStr = form.get("size") as string | null;
        const name = form.get("name") as string | null;
        const type = form.get("type") as string | null;
        
        if (!sizeStr || !name || !type) {
          return NextResponse.json({ error: "Missing required metadata for pre-uploaded file" }, { status: 400 });
        }
        
        fileSize = parseInt(sizeStr, 10);
        fileName = name;
        fileType = type;
        
        // Validate uploaded path format
        if (!uploadedPath.startsWith(`${projectId}/`)) {
          return NextResponse.json({ error: "Invalid uploaded path" }, { status: 400 });
        }
      } else {
        // Original flow - file uploaded via FormData
        newFile = form.get("file") as File | null;
        if (!(newFile instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
        
        fileSize = newFile.size;
        fileName = newFile.name;
        fileType = newFile.type;
      }

      // Validate MIME and size (allow audio + common DAW/project/preset/archive/doc/image/video)
      const allowMimeOrExt: RegExp[] = [
        /^audio\//i,
        /^image\//i,
        /^video\//i,
        /^application\/pdf$/i,
        /\.(wav|mp3|flac|aac|aiff|ogg|m4a|opus|mid|midi|syx|als|flp|logicx|band|cpr|ptx|rpp|song|bwproject|reason|nki|adg|fst|fxp|fxb|nmsv|h2p|zip|rar|7z|tar|gz|txt|md|doc|docx|pdf|png|jpg|jpeg|gif|webp|svg|mp4|mov|mkv|json|xml)$/i,
      ];
      const name = fileName || file.filename || "file";
      const fileWithType = file as { file_type?: string };
      const type = fileType || fileWithType.file_type || "application/octet-stream";
      const size = fileSize;
      const maxBytes = getMaxUploadFileBytes();
      const allowed = allowMimeOrExt.some((re) => re.test(type) || re.test(name));
      if (!allowed) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
      }
      if (size <= 0 || size > maxBytes) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }

      // Quota check before uploading replacement
      {
        const incomingBytes = size;
        const { allowed, maxBytes: quotaMax, usedBytes } = await willExceedUserQuota(user.id, incomingBytes);
        if (!allowed) {
          return NextResponse.json(
            {
              error: "Storage quota exceeded",
              code: "QUOTA_EXCEEDED",
              details: {
                maxBytes: quotaMax,
                usedBytes,
                incomingBytes,
                remainingBytes: Math.max(0, quotaMax - usedBytes),
              },
            },
            { status: 413 }
          );
        }
      }

      // Upload new object or use pre-uploaded path
      let newKey: string;
      
      if (isMetadataOnly) {
        // File already uploaded directly to Supabase Storage
        newKey = uploadedPath;
      } else {
        // Upload via existing function
        newKey = await uploadProjectObject({ projectId, file: newFile! });
      }

      // Insert new file record
      const { data: newFileRow, error: insertNewErr } = await (supabase as SupabaseClient)
        .from("project_files")
        .insert({
          project_id: projectId,
          filename: name,
          file_path: newKey,
          file_size: size,
          file_type: type,
          uploaded_by: user.id,
          metadata: {
            ...(description ? { description } : {}),
            supersedes: file.id,
            replaced_at: new Date().toISOString(),
          },
        })
        .select("id")
        .single();
      if (insertNewErr || !newFileRow) {
        return NextResponse.json({ error: "Failed to create new file record" }, { status: 500 });
      }

      // Determine a version to link to (prefer the one the old file was linked to; else active; else none)
      let linkVersionId: string | null = null;
      try {
        const { data: vf } = await (supabase as SupabaseClient)
          .from("version_files")
          .select("version_id")
          .eq("file_id", validFileId)
          .maybeSingle();
        if (vf?.version_id) {
          linkVersionId = vf.version_id as string;
        } else {
          const { data: activeVersion } = await (supabase as SupabaseClient)
            .from("project_versions")
            .select("id")
            .eq("project_id", projectId)
            .eq("is_active", true)
            .maybeSingle();
          linkVersionId = activeVersion?.id ?? null;
        }
      } catch {}

      if (linkVersionId) {
        // Link the new file to the version
        {
          const { error } = await (supabase as SupabaseClient)
            .from("version_files")
            .insert({ version_id: linkVersionId, file_id: newFileRow.id });
          void error; // ignore error (best-effort)
        }

        // Optional: unlink the old file from that version so the list shows the new one
        {
          const { error } = await (supabase as SupabaseClient)
            .from("version_files")
            .delete()
            .eq("version_id", linkVersionId)
            .eq("file_id", validFileId);
          void error; // ignore error
        }

        // Log activity change
        {
          const { error } = await (supabase as SupabaseClient)
            .from("activity_changes")
            .insert({
              version_id: linkVersionId,
              type: "update",
              description: `Replaced file: ${file.filename} → ${name}`,
              author_id: user.id,
              file_id: newFileRow.id,
            });
          void error; // ignore error
        }
      }

      // Update old file metadata to point to the new one
      try {
        const mergedMeta = { ...(file.metadata || {}), superseded_by: newFileRow.id } as Record<string, unknown>;
        await (supabase as SupabaseClient)
          .from("project_files")
          .update({ metadata: mergedMeta })
          .eq("id", validFileId);
      } catch {}

      // Copy unresolved top-level comments from old file to new file (best-effort, capped)
      try {
        const { data: oldComments } = await (supabase as SupabaseClient)
          .from("project_comments")
          .select("user_id, comment, timestamp_ms")
          .eq("project_id", projectId)
          .eq("file_id", validFileId)
          .is("parent_id", null)
          .eq("resolved", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if ((oldComments || []).length > 0) {
          const payload = (oldComments || []).map((c: OldComment) => ({
            project_id: projectId,
            user_id: c.user_id,
            comment: c.comment,
            parent_id: null,
            activity_change_id: null,
            version_id: null,
            file_id: newFileRow.id,
            timestamp_ms: c.timestamp_ms ?? null,
          }));
          const { error } = await (supabase as SupabaseClient).from("project_comments").insert(payload);
          void error; // ignore error
        }
      } catch {}

      return NextResponse.json({ newFileId: newFileRow.id }, { status: 200 });
    }

    if (action === "delete") {
      if (!(project.owner_id === user.id || file.uploaded_by === user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Try to resolve a version to attach the deletion activity to
      let versionId: string | null = null;
      try {
        const { data: vf } = await (supabase as SupabaseClient)
          .from("version_files")
          .select("version_id")
          .eq("file_id", validFileId)
          .maybeSingle();
        if (vf?.version_id) {
          versionId = vf.version_id as string;
        } else {
          const { data: pv } = await (supabase as SupabaseClient)
            .from("project_versions")
            .select("id, is_active, created_at")
            .eq("project_id", projectId)
            .order("is_active", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          versionId = pv?.id ?? null;
        }
      } catch {}

      // Remove file-linked activity changes and comments; then log a single deletion entry
      try {
        // Delete comments linked to this file
        await (supabase as SupabaseClient)
          .from("project_comments")
          .delete()
          .eq("project_id", projectId)
          .eq("file_id", validFileId);

        // Delete activity changes linked to this file
        await (supabase as SupabaseClient)
          .from("activity_changes")
          .delete()
          .eq("file_id", validFileId);

        // Insert one consolidated deletion activity (without file_id)
        if (versionId) {
          await (supabase as SupabaseClient)
            .from("activity_changes")
            .insert({
              version_id: versionId,
              type: "deletion",
              description: `Deleted file: ${file.filename}`,
              author_id: user.id,
              file_id: null,
            });
        }
      } catch (e) {
        console.error("Failed to update activity/comments on deletion:", e);
      }

      await removeObject(file.file_path).catch(() => {});
      // Unlink from all versions
      {
        const { error: unlinkErr } = await (supabase as SupabaseClient)
          .from("version_files")
          .delete()
          .eq("file_id", validFileId);
        if (unlinkErr) {
          console.error("Failed to unlink version_files:", unlinkErr);
          return NextResponse.json({ error: "Failed to unlink from versions" }, { status: 500 });
        }
      }
      // Hard delete the file row to remove it from all listings
      {
        const { error: delErr } = await (supabase as SupabaseClient)
          .from("project_files")
          .delete()
          .eq("id", validFileId)
          .eq("project_id", projectId);
        if (delErr) {
          console.error("Failed to hard delete project_files row:", delErr);
          return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
        }
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Unexpected error in file action route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
