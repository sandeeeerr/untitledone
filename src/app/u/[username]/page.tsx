import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import LayoutSidebar from "@/components/layout-sidebar";
import { OwnerEditButton } from "./owner-edit";
import { MapPin, Link as LinkIcon, CalendarDays } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { SocialIconMap } from "@/components/socials";
import { ProfileSectionTabs } from "./section-tabs";
import { ProfileActions } from "./profile-actions";

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
  const [profile, socials] = await Promise.all([
    getProfile(username),
    getSocials(username),
  ]);
  if (!profile) {
    notFound();
  }

  const title = profile.display_name || profile.username;
  const t = await getTranslations();

  return (
    <LayoutSidebar>
      <div className="py-8">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
            </div>
            <ProfileSectionTabs />
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
      </div>
    </LayoutSidebar>
  );
} 