import { Tables, TablesUpdate } from "@/types/database";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export async function getCurrentProfile() {
  const res = await fetch("/api/profile", { method: "GET" });
  if (res.status === 401) return null;
  if (!res.ok) {
    const err = await safeParseError(res);
    throw new Error(err ?? "Failed to load profile");
  }
  const data = (await res.json()) as Profile;
  return data;
}

export async function updateCurrentProfile(update: ProfileUpdate) {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      display_name: update.display_name ?? undefined,
      bio: update.bio ?? undefined,
      location: update.location ?? undefined,
    }),
  });

  if (!res.ok) {
    const err = await safeParseError(res);
    throw new Error(err ?? "Failed to update profile");
  }

  const data = (await res.json()) as Profile;
  return data;
}

export async function deleteCurrentProfile() {
  const res = await fetch("/api/profile", { method: "DELETE" });
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok && res.status !== 204) {
    const err = await safeParseError(res);
    throw new Error(err ?? "Failed to delete profile");
  }
}

async function safeParseError(res: Response) {
  try {
    const body = await res.json();
    return body?.error as string | undefined;
  } catch {
    return undefined;
  }
} 