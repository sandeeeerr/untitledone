import createServerClient from "./server";

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


