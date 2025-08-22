import createClient from "./client";

/**
 * Uploads a user's avatar image to Supabase Storage 'avatars' bucket under `${userId}/avatar.ext`.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  // Try to upsert by removing existing file first (ignore errors)
  await supabase.storage.from("avatars").remove([path]).catch(() => {});

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!pub?.publicUrl) {
    throw new Error("Failed to resolve public URL for avatar");
  }

  return pub.publicUrl;
}


