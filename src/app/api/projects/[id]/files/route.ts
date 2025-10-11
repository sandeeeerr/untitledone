import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import createServerClient from "@/lib/supabase/server";
import { willExceedUserQuota } from "@/lib/supabase/storage";
import { getMaxUploadFileBytes } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage/factory";
import type { StorageProviderType } from "@/lib/storage/types";

// Type for file metadata
interface FileMetadata {
  deleted_at?: string | null;
  [key: string]: unknown;
}

// Type for project file with metadata
interface ProjectFileWithMetadata {
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

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

const metaSchema = z.object({
  description: z.string().optional(),
  versionId: z.string().uuid().optional(),
  storageProvider: z.enum(['local', 'dropbox', 'google_drive']).optional().default('local'),
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

    // Per-file size guard (configurable)
    {
      const maxBytes = getMaxUploadFileBytes();
      const size = Number(file.size || 0);
      if (size <= 0 || size > maxBytes) {
        return NextResponse.json({ error: "File too large", code: "FILE_TOO_LARGE", details: { maxBytes, size } }, { status: 413 });
      }
    }
    const description = (form.get("description") as string | null) || undefined;
    const versionIdRaw = (form.get("versionId") as string | null) || undefined;
    const storageProviderRaw = (form.get("storageProvider") as string | null) || undefined;
    const meta = metaSchema.safeParse({ description, versionId: versionIdRaw, storageProvider: storageProviderRaw });
    if (!meta.success) {
      return NextResponse.json({ error: "Invalid input", details: meta.error.issues }, { status: 400 });
    }

    const storageProvider = meta.data.storageProvider as StorageProviderType;

    // Quota check before uploading (only for local storage)
    if (storageProvider === 'local') {
      const incomingBytes = Number(file.size || 0);
      const { allowed, maxBytes, usedBytes } = await willExceedUserQuota(user.id, incomingBytes);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Storage quota exceeded",
            code: "QUOTA_EXCEEDED",
            details: {
              maxBytes,
              usedBytes,
              incomingBytes,
              remainingBytes: Math.max(0, maxBytes - usedBytes),
            },
          },
          { status: 413 }
        );
      }
    }

    // Get storage provider adapter
    let uploadResult;
    try {
      const adapter = await getStorageProvider(storageProvider, user.id);
      const uploadPath = `${projectId}/${crypto.randomUUID()}-${file.name}`;
      uploadResult = await adapter.upload(file, uploadPath, user.id);
    } catch (error) {
      console.error("Storage provider upload failed:", error);
      
      // Check for specific error codes
      if (error instanceof Error) {
        if (error.message.includes('PROVIDER_NOT_CONNECTED')) {
          return NextResponse.json(
            { error: "Storage provider not connected", code: "PROVIDER_NOT_CONNECTED" },
            { status: 400 }
          );
        }
        if (error.message.includes('PROVIDER_TOKEN_EXPIRED')) {
          return NextResponse.json(
            { error: "Storage provider token expired", code: "PROVIDER_TOKEN_EXPIRED" },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json(
        { error: "Failed to upload file to storage provider" },
        { status: 500 }
      );
    }

    // Insert file metadata
    const { data: fileRecord, error: insertError } = await (supabase as SupabaseClient)
      .from("project_files")
      .insert({
        project_id: projectId,
        filename: file.name,
        file_path: uploadResult.path,
        file_size: uploadResult.size,
        file_type: file.type || "application/octet-stream",
        uploaded_by: user.id,
        storage_provider: storageProvider,
        external_file_id: storageProvider !== 'local' ? uploadResult.fileId : null,
        external_metadata: storageProvider !== 'local' ? uploadResult.metadata : null,
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
      const { data: activeVersion } = await (supabase as SupabaseClient)
        .from("project_versions")
        .select("id")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .maybeSingle();
      
      // Active version lookup for auto-linking uploaded files
      resolvedVersionId = activeVersion?.id ?? null;
    }

    if (resolvedVersionId) {
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
    }
    // Note: If no active version exists, file will remain unversioned

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
      .select("id, filename, file_size, file_type, uploaded_at, uploaded_by, metadata, storage_provider")
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
          return !(meta && typeof meta === 'object' && (meta as FileMetadata).deleted_at);
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
        storageProvider: (file as any).storage_provider || 'local',
      };
    });

    return NextResponse.json(enrichedFiles, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in files list route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
