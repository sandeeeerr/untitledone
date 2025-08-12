export type SocialPlatform =
  | "soundcloud"
  | "spotify"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "twitch"
  | "bandcamp"
  | "mixcloud";

export interface SocialLinkDto {
  platform: SocialPlatform;
  url: string;
}

export async function getCurrentSocials(): Promise<SocialLinkDto[]> {
  const res = await fetch("/api/socials", { cache: "no-store" });
  if (res.status === 401) return [];
  if (!res.ok) {
    throw new Error("Failed to load socials");
  }
  return (await res.json()) as SocialLinkDto[];
}

export async function putCurrentSocials(links: SocialLinkDto[]): Promise<SocialLinkDto[]> {
  const res = await fetch("/api/socials", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ links }),
  });
  if (!res.ok) {
    const msg = await safeParseError(res);
    throw new Error(msg ?? "Failed to save socials");
  }
  return (await res.json()) as SocialLinkDto[];
}

export async function getSocialsByUsername(username: string): Promise<SocialLinkDto[]> {
  const res = await fetch(`/api/socials/${encodeURIComponent(username)}`, { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error("Failed to load socials");
  }
  return (await res.json()) as SocialLinkDto[];
}

async function safeParseError(res: Response) {
  try {
    const body = await res.json();
    return (body as { error?: string })?.error;
  } catch {
    return undefined;
  }
} 