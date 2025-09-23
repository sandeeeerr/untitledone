import createServerClient from "./server";
import { getMaxUserStorageBytes } from "../env";

export async function uploadProjectObject(opts: { projectId: string; file: File; path?: string }) {
  const supabase = await createServerClient();
  const key = opts.path || `${opts.projectId}/${crypto.randomUUID()}-${opts.file.name}`;
  const { error } = await supabase.storage
    .from("project-files")
    .upload(key, opts.file, { upsert: false, cacheControl: "3600", contentType: opts.file.type || "application/octet-stream" });
  if (error) throw new Error(error.message);
  return key;
}

export async function getSignedDownloadUrl(path: string, expiresIn = 60 * 10) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage.from("project-files").createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) throw new Error(error?.message || "Failed to create signed URL");
  return data.signedUrl;
}

export async function removeObject(path: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.storage.from("project-files").remove([path]);
  if (error) throw new Error(error.message);
}

export async function replaceObject(path: string, file: File) {
  const supabase = await createServerClient();
  await supabase.storage.from("project-files").remove([path]).catch(() => {});
  const { error } = await supabase.storage
    .from("project-files")
    .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type || "application/octet-stream" });
  if (error) throw new Error(error.message);
}

/**
 * Compute current total bytes used by a user across all their uploaded project files.
 * Based on authoritative `public.project_files` table rows (hard-deleted on removal).
 */
export async function getUserUsedBytes(userId: string): Promise<number> {
  const supabase = await createServerClient();
  // Aggregate sum of file_size for rows uploaded_by = userId
  const { data, error } = await supabase
    .from("project_files")
    .select("file_size", { count: "exact" })
    .eq("uploaded_by", userId);
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  let total = 0;
  for (const row of rows as Array<{ file_size: number }>) {
    const size = Number(row.file_size || 0);
    if (!Number.isNaN(size) && size > 0) total += size;
  }
  return total;
}

export async function willExceedUserQuota(userId: string, incomingBytes: number): Promise<{ allowed: boolean; maxBytes: number; usedBytes: number }>{
  const maxBytes = getMaxUserStorageBytes();
  const usedBytes = await getUserUsedBytes(userId);
  const allowed = usedBytes + Math.max(0, Number(incomingBytes || 0)) <= maxBytes;
  return { allowed, maxBytes, usedBytes };
}


