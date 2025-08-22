import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import LayoutSidebar from "@/components/organisms/layout-sidebar";
import { OwnerEditButton } from "./owner-edit";
import { MapPin, Link as LinkIcon, CalendarDays, FileAudio, Users, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SocialIconMap } from "@/components/molecules/socials";
import { ProfileSectionTabs } from "./section-tabs";
import { ProfileActions } from "./profile-actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { colorFromString } from "@/lib/utils";
import UserAvatar from "@/components/atoms/user-avatar";

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
    created_at?: string | null;
  };
}

async function getSocials(username: string) {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = host ? `${protocol}://${host}` : "";

  const res = await fetch(`${base}/api/socials/${encodeURIComponent(username)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return [] as Array<{ platform: string; url: string }>;
  if (!res.ok) throw new Error("Failed to load socials");
  return (await res.json()) as Array<{ platform: string; url: string }>;
}

function getInitial(nameOrUsername: string) {
  const char = nameOrUsername.trim().charAt(0).toUpperCase();
  return char || "U";
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profile, socials, projects] = await Promise.all([
    getProfile(username),
    getSocials(username),
    (async () => {
      const hdrs = await headers();
      const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
      const protocol = hdrs.get("x-forwarded-proto") ?? "http";
      const base = host ? `${protocol}://${host}` : "";
      const res = await fetch(`${base}/api/projects?owner_username=${encodeURIComponent(username)}`, { cache: "no-store" });
      if (!res.ok) return [] as Array<{ id: string; name: string; description: string | null; is_private: boolean; file_count: number; collaborators_count: number; likes_count: number }>;
      return (await res.json()) as Array<{ id: string; name: string; description: string | null; is_private: boolean; file_count: number; collaborators_count: number; likes_count: number }>;
    })(),
  ]);
  if (!profile) {
    notFound();
  }

  const title = profile.display_name || profile.username;

  return (
    <LayoutSidebar>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    className="h-16 w-16 border"
                    name={title}
                    username={profile.username}
                    userId={undefined}
                    src={profile.avatar_url || null}
                  />
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
                    <div className="text-muted-foreground">@{profile.username}</div>
                  </div>
                </div>
                <OwnerEditButton viewedUsername={profile.username} />
              </div>
            </div>
            <ProfileSectionTabs />

            {/* User projects list full-width below filters */}
            {projects && projects.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">Projects</h3>
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="transition-colors hover:border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className="text-lg font-semibold truncate">
                              {project.name}
                            </CardTitle>
                            <Badge variant={project.is_private ? "secondary" : "default"} className="shrink-0">
                              {project.is_private ? "Privé" : "Openbaar"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-10">
                            {project.description || "\u00A0"}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                            <div className="flex items-center gap-4">
                              <span className="inline-flex items-center gap-1"><FileAudio className="h-3 w-3" />{project.file_count ?? 0}</span>
                              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{project.collaborators_count ?? 0}</span>
                            </div>
                            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{project.likes_count ?? 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h4 className="text-xl font-semibold">{title}</h4>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileActions viewedUsername={profile.username} />
                <div>
                  <p className="text-muted-foreground text-sm">Details</p>
                  <div className="space-y-2 text-sm">
                    {profile.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:text-foreground text-muted-foreground"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span className="truncate">{profile.website}</span>
                      </a>
                    )}
                    {profile.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <>
                    <div>
                      <p className="text-muted-foreground text-sm">About</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  </>
                )}

                {socials.length > 0 && (
                  <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm">Social</p>
                    <div className="flex flex-wrap gap-2">
                      {socials.map((s) => {
                        const Icon = SocialIconMap[s.platform as keyof typeof SocialIconMap];
                        const href = s.url.startsWith("http") ? s.url : `https://${s.url}`;
                        return (
                          <a
                            key={`${s.platform}-${s.url}`}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-accent"
                            aria-label={s.platform}
                            title={s.platform}
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                  </>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
    </LayoutSidebar>
  );
} 