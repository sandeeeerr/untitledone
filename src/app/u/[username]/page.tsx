import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import LayoutSidebar from "@/components/layout-sidebar";
import { OwnerEditButton } from "./owner-edit";
import { MapPin, Link as LinkIcon } from "lucide-react";

async function getProfile(username: string) {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = host ? `${protocol}://${host}` : "";

  const res = await fetch(`${base}/api/profile/${encodeURIComponent(username)}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load profile");
  return (await res.json()) as {
    username: string;
    display_name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url?: string | null;
    website?: string | null;
  };
}

function getInitial(nameOrUsername: string) {
  const char = nameOrUsername.trim().charAt(0).toUpperCase();
  return char || "U";
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) {
    notFound();
  }

  const title = profile.display_name || profile.username;

  return (
    <LayoutSidebar title={title}>
      <div className="py-8">
        <div className="w-full">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={title ?? "Avatar"}
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border">
                      {getInitial(title || profile.username)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
                    <div className="text-muted-foreground">@{profile.username}</div>
                  </div>
                </div>
                <OwnerEditButton viewedUsername={profile.username} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-foreground"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>{profile.website}</span>
                  </a>
                )}
              </div>

              {profile.bio && (
                <div>
                  <div className="text-sm font-medium mb-1">About</div>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutSidebar>
  );
} 