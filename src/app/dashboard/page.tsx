'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';
import type { WidgetItem } from '@/lib/ui/widget-types';
import WidgetGrid from '@/components/organisms/widget-grid.client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getCurrentProfile } from '@/lib/api/profiles';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import { Badge } from '@/components/ui/badge';
import Prose from '@/components/atoms/prose';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, Plus, Sparkles, Pencil, Pin, Clock, Users, FileAudio, Star } from 'lucide-react';
import { CircleAlert as CircleAlertIcon, X as XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UserAvatar from '@/components/atoms/user-avatar';
import { getProjects, type Project, getProjectsLastActivity, getProject, getProjectActivity, type ProjectActivityMicroChange, type ProjectActivityVersion, listProjectMembers, type ProjectMember } from '@/lib/api/projects';
import { listPins } from '@/lib/api/pins';
import { formatRelativeTime, formatRelativeTimeWithTranslations } from '@/lib/utils/time';
import { getChangeIcon, getChangePrefix } from '@/lib/ui/activity';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Performance: Dashboard data fetching is already parallelized within categories (Promise.all).
// For further optimization, consider creating a single /api/dashboard endpoint that aggregates:
// - Recent projects with last activity
// - Pinned projects with members
// - Activity digest
// This would reduce round trips and improve initial load time.
export default function DashboardPage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const [profileMissing, setProfileMissing] = useState<{ needsDisplay: boolean; needsUsername: boolean } | null>(null);
  const [dashboardAlertDismissed, setDashboardAlertDismissed] = useState<boolean>(false);
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [emailResent, setEmailResent] = useState<boolean>(false);
  const t = useTranslations('dashboard');
  const tNav = useTranslations('navigation');
  const tProj = useTranslations('projects');
  const [layout, setLayout] = useState<WidgetItem[]>(() => ([
    { id: 'hello-1', widgetType: 'hello', x: 0, y: 0, w: 4, h: 3, title: 'Widget 1', locked: true },
    { id: 'hello-2', widgetType: 'hello', x: 4, y: 0, w: 4, h: 3, title: 'Widget 2', locked: true },
  ]));
  const [isEditing, setIsEditing] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Record<string, string>>({});
  const [pinnedProjects, setPinnedProjects] = useState<Project[] | null>(null);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [pinnedMembers, setPinnedMembers] = useState<Record<string, ProjectMember[]>>({});
  const [digest, setDigest] = useState<Array<{
    projectId: string;
    projectName: string;
    type: ProjectActivityMicroChange['type'];
    description: string;
    timestamp: string; // ISO
    filename?: string;
  }>>([]);
  const [digestLoading, setDigestLoading] = useState(false);

  const gridOptions = useMemo(() => ({ column: 12, margin: 8, float: true }), []);

  // Once-per-session welcome toast (bottom-right), 20s, dismissible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'dashboard_welcome_toast_shown';
      const hasShown = window.sessionStorage.getItem(key) === '1';
      if (hasShown) return;
      window.sessionStorage.setItem(key, '1');
      const email = currentUser?.email ?? '';
      toast({
        title: t('welcome'),
        description: (
          <div className="text-sm leading-relaxed">
            <div className="opacity-80">{email}</div>
            <div className="mt-2">
              {t('developmentMessage')}
            </div>
            <div className="mt-2">
              {t('betaNote')}{' '}
              <a className="underline underline-offset-2" href="https://github.com/sandeeeerr/untitledone/issues" target="_blank" rel="noreferrer">
                {t('contributeLink')}
              </a>
              .
            </div>
          </div>
        ),
        duration: 20000,
        // Slightly wider toast content
        className: 'max-w-[560px]'
      });
    } catch {}
    // Only run on mount and when user changes (e.g., after login)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const resendVerificationEmail = async () => {
    if (!currentUser?.email || resendingEmail) return;
    
    setResendingEmail(true);
    try {
      const supabase = (await import('@/lib/supabase-client')).default;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
      });
      
      if (error) throw error;
      
      setEmailResent(true);
      setTimeout(() => setEmailResent(false), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setResendingEmail(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function checkProfile() {
      try {
        if (!currentUser) { setProfileMissing(null); return; }
        const p = await getCurrentProfile().catch(() => null as any);
        if (cancelled) return;
        const needsDisplay = !p?.display_name;
        const needsUsername = !p?.username;
        setProfileMissing({ needsDisplay, needsUsername });
        try {
          const v = window.localStorage.getItem('dashboardAlertDismissed');
          setDashboardAlertDismissed(v === '1');
        } catch {}
      } catch {
        setProfileMissing(null);
      }
    }
    checkProfile();
    return () => { cancelled = true; };
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    async function loadRecent() {
      try {
        setRecentLoading(true);
        const projects = await getProjects();
        if (cancelled) return;
        // sort by updated_at desc, take 5
        const sorted = [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const top = sorted.slice(0, 5);
        setRecentProjects(top);
        const ids = top.map((p) => p.id);
        if (ids.length) {
          const last = await getProjectsLastActivity(ids);
          if (!cancelled) setRecentActivity(last);
        }
      } catch {
        setRecentProjects([]);
      } finally {
        setRecentLoading(false);
      }
    }
    loadRecent();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPins() {
      try {
        setPinsLoading(true);
        const pins = await listPins();
        if (cancelled) return;
        if (!pins.length) { setPinnedProjects([]); return; }
        // Fetch each pinned project detail
        const projs = await Promise.all(pins.map((p) => getProject(p.project_id).catch(() => null)));
        const filtered = projs.filter((p): p is Project => !!p).slice(0, 5);
        setPinnedProjects(filtered);
      } catch {
        setPinnedProjects([]);
      } finally {
        setPinsLoading(false);
      }
    }
    loadPins();
    return () => { cancelled = true; };
  }, []);

  // Load members for pinned projects (for avatar group)
  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      try {
        const projs = pinnedProjects ?? [];
        if (!projs.length) { setPinnedMembers({}); return; }
        const entries = await Promise.all(
          projs.map(async (p) => {
            try {
              const members = await listProjectMembers(p.id);
              return [p.id, members as ProjectMember[]] as [string, ProjectMember[]];
            } catch {
              return [p.id, [] as ProjectMember[]] as [string, ProjectMember[]];
            }
          })
        );
        if (cancelled) return;
        const map: Record<string, ProjectMember[]> = {};
        for (const [id, members] of entries) map[id] = members;
        setPinnedMembers(map);
      } catch {
        // ignore
      }
    }
    loadMembers();
    return () => { cancelled = true; };
  }, [pinnedProjects]);

  // Load activity digest using recent and pinned projects as source (authorized projects via API)
  useEffect(() => {
    let cancelled = false;
    async function loadDigest() {
      try {
        setDigestLoading(true);
        const sourceProjects: Project[] = Array.from(new Map(
          [...(recentProjects ?? []), ...(pinnedProjects ?? [])].map((p) => [p.id, p])
        ).values());
        const candidates = sourceProjects
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 8);
        if (!candidates.length) { setDigest([]); return; }
        const activities = await Promise.all(
          candidates.map(async (p) => {
            try {
              const versions = await getProjectActivity(p.id);
              return { project: p, versions } as { project: Project; versions: ProjectActivityVersion[] };
            } catch {
              return { project: p, versions: [] } as { project: Project; versions: ProjectActivityVersion[] };
            }
          })
        );
        if (cancelled) return;
        const items: Array<{ projectId: string; projectName: string; type: ProjectActivityMicroChange['type']; description: string; timestamp: string; filename?: string; }> = [];
        activities.forEach(({ project, versions }) => {
          versions.forEach((v) => {
            v.microChanges.forEach((mc) => {
              const ts = (mc.fullTimestamp as string | undefined) || (mc.time as string | undefined) || project.updated_at;
              items.push({
                projectId: project.id,
                projectName: project.name,
                type: mc.type,
                description: mc.description,
                timestamp: ts,
                filename: mc.filename,
              });
            });
          });
        });
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setDigest(items.slice(0, 4));
      } finally {
        setDigestLoading(false);
      }
    }
    loadDigest();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentProjects, pinnedProjects]);

  return (
    <LayoutSidebar title={t('title')} titleActions={
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <Pencil className="mr-2 h-4 w-4" />
          {t('editDashboard', { default: 'Edit dashboard' })}
        </Button>
      </div>
    }>
      <div className="space-y-6">
        {/* One-time alert (above welcome) */}
        {(() => {
          const needsProfile = !!profileMissing && (profileMissing.needsDisplay || profileMissing.needsUsername);
          const needsEmailVerification = !currentUser?.email_confirmed_at;
          const shouldShow = (needsProfile || needsEmailVerification) && !dashboardAlertDismissed;
          if (!shouldShow) return null;
          return (
            <div className="w-full p-6 flex justify-center">
              <div className="w-full max-w-lg">
                <Alert className="flex justify-between" variant={emailResent ? 'default' : 'default'}>
                  <CircleAlertIcon />
                  <div className="flex flex-1 flex-col gap-2">
                    <AlertTitle>
                      {emailResent ? t('alerts.emailResentTitle', { default: 'Email sent!' }) : t('alerts.verifyEmailTitle', { default: 'Verify your email to activate your account' })}
                    </AlertTitle>
                    <AlertDescription>
                      {emailResent 
                        ? t('alerts.emailResentDescription', { default: 'Check your inbox for the verification link.' })
                        : t('alerts.verifyEmailDescription', { default: "We've sent a confirmation link to your inbox. Check your email to complete the sign-up." })
                      }
                    </AlertDescription>
                    {!emailResent && (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm font-normal justify-start"
                        onClick={resendVerificationEmail}
                        disabled={resendingEmail}
                      >
                        {resendingEmail 
                          ? t('alerts.resendingEmail', { default: 'Sending...' })
                          : t('alerts.resendEmail', { default: 'Resend verification email' })
                        }
                      </Button>
                    )}
                  </div>
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      try { window.localStorage.setItem('dashboardAlertDismissed', '1'); } catch {}
                      setDashboardAlertDismissed(true);
                    }}
                    aria-label="Close alert"
                  >
                    <XIcon className="size-5" />
                    <span className="sr-only">Close</span>
                  </button>
                </Alert>
              </div>
            </div>
          );
        })()}

        {/* Hero replaced by once-per-session toast */}

        {/* removed old profile alert */}

        {/* Overview: Activity digest (2/3) + Pinned projects (1/3) */}
        <div className="grid gap-4 md:grid-cols-12">
          {/* Activity Digest */}
          <Card className="md:col-span-8">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Clock className="h-4 w-4" />
                {t('activityDigest')}
              </div>
              <div className="space-y-2">
                {digestLoading && <Skeleton className="h-6 w-40" />}
                {!digestLoading && digest.length > 0 && digest.map((item, idx) => {
                  const unread = Date.now() - new Date(item.timestamp).getTime() < 24 * 60 * 60 * 1000;
                  const typeBg: Record<string, string> = {
                    feedback: 'bg-blue-50/40 dark:bg-blue-950/10',
                    addition: 'bg-green-50/40 dark:bg-green-950/10',
                    update: 'bg-orange-50/40 dark:bg-orange-950/10',
                    deletion: 'bg-red-50/40 dark:bg-red-950/10',
                  };
                  const typeBorder: Record<string, string> = {
                    feedback: 'border-blue-200 dark:border-blue-900/30',
                    addition: 'border-green-200 dark:border-green-900/30',
                    update: 'border-orange-200 dark:border-orange-900/30',
                    deletion: 'border-red-200 dark:border-red-900/30',
                  };
                  const barColor: Record<string, string> = {
                    feedback: 'bg-blue-500',
                    addition: 'bg-green-500',
                    update: 'bg-orange-500',
                    deletion: 'bg-red-500',
                  };
                  const tKey = item.type in typeBg ? item.type : 'update';
                  return (
                    <Link
                      key={`digest-${idx}-${item.projectId}`}
                      href={`/projects/${item.projectId}`}
                      className={cn(
                        'flex items-center gap-3 rounded-md border px-3 py-2 transition-colors',
                        typeBg[tKey],
                        typeBorder[tKey]
                      )}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        {getChangeIcon(item.type)}
                        <span className={cn('h-2 w-2 rounded-full', unread ? 'bg-primary' : 'bg-muted-foreground/30')} aria-label={unread ? t('unread') : ''} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm" title={item.description}>
                          <span className="font-medium mr-1">{getChangePrefix(item.type)}</span>
                          <span>{item.description}</span>
                          {item.filename ? <span className="text-muted-foreground"> · {item.filename}</span> : null}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{item.projectName} · {formatRelativeTime(item.timestamp)}</div>
                      </div>
                    </Link>
                  );
                })}
                {!digestLoading && digest.length === 0 && (
                  <div className="text-sm text-muted-foreground">{t('noActivityDigest')}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pinned projects */}
          <Card className="md:col-span-4">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="h-4 w-4" />
                  {t('pinnedProjects')}
                </div>
                {/* Decorative star removed per request */}
              </div>
              <div className="space-y-2">
                {pinsLoading && <Skeleton className="h-6 w-40" />}
                {!pinsLoading && (pinnedProjects?.length ? (
                  pinnedProjects.map((p) => {
                    const members = pinnedMembers[p.id] ?? [];
                    const avatars = members.slice(0, 5);
                    return (
                      <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-md border px-3 py-2 hover:bg-accent">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="truncate font-semibold">{p.name}</div>
                          <Badge
                            variant={p.is_private ? 'secondary' : 'default'}
                            className={(p.is_private ? 'shrink-0' : 'shrink-0 bg-green-500 hover:bg-green-600') + ' px-1.5 py-0 text-[10px]'}
                          >
                            {p.is_private ? tProj('private') : tProj('public')}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="flex -space-x-2">
                            {avatars.map((m) => (
                              <UserAvatar
                                key={m.user_id}
                                className="h-6 w-6 ring-2 ring-background"
                                name={m.profile?.display_name || m.profile?.username || undefined}
                                username={m.profile?.username || undefined}
                                userId={m.user_id}
                                src={m.profile?.avatar_url || null}
                              />
                            ))}
                            {members.length > avatars.length && (
                              <div className="h-6 w-6 rounded-full bg-muted text-xs flex items-center justify-center ring-2 ring-background">
                                +{members.length - avatars.length}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{t('lastUpdatedShort')}: {formatRelativeTime(p.updated_at)}</div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">{t('noPins')}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom: recent projects (full width, 3 items, same as Projects index cards) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              {t('recentProjects')}
            </div>
            <div className="flex items-center gap-2">
              {(recentProjects && recentProjects.length > 0) && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/projects">{t('viewAllProjects', { default: tNav('projects') })}</Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addProject')}
                </Link>
              </Button>
            </div>
          </div>
          {(!recentProjects || recentProjects.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Rocket className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t('noRecentProjects')}</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Create your first project to start collaborating with audio creatives. Share files, exchange feedback, and manage versions all in one place.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild size="lg">
                      <Link href="/projects/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Project
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="https://github.com/sandeeeerr/untitledone#readme" target="_blank" rel="noreferrer">
                        Learn More
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(recentProjects ?? []).slice(0, 3).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group">
                <Card className="transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 cursor-pointer h-full">
                  <div className="p-6 pb-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </div>
                      <Badge
                        variant={project.is_private ? 'secondary' : 'default'}
                        className={(project.is_private ? 'shrink-0' : 'shrink-0 bg-green-500 hover:bg-green-600') + ' px-1.5 py-0 text-[10px]'}
                      >
                        {project.is_private ? tProj('private') : tProj('public')}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        className="h-8 w-8 shrink-0"
                        name={project.creator?.name}
                        username={undefined}
                        userId={project.creator?.id}
                        src={project.creator?.avatar || null}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.creator?.name || tProj('unknownCreator')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTimeWithTranslations(project.updated_at, {
                            justNow: tProj('time.justNow'),
                            hoursAgo: (count) => tProj('time.hoursAgo', { count }),
                            yesterday: tProj('time.yesterday'),
                            daysAgo: (count) => tProj('time.daysAgo', { count })
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="min-h-12">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description || '\u00A0'}
                      </p>
                    </div>

                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileAudio className="h-3 w-3" />
                          <span>{project.file_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{project.collaborators_count ?? 1}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          )}
        </div>

        {userLoading && <Skeleton className="h-8 w-64" />}

        {/* Edit toolbar (appears only while editing) */}
        {isEditing && (
          <div className="flex items-center justify-end">
            <div id="dashboard-toolbar" className="hidden md:flex items-center gap-2">
              <div className="grid-stack-item border rounded px-3 py-2 text-xs text-muted-foreground">
                {t('dragNewWidget', { default: 'Drag new widget' })}
              </div>
              <div id="dashboard-trash" className="border rounded px-3 py-2 text-xs text-red-500">
                {t('dropToRemove', { default: 'Drop to remove' })}
              </div>
            </div>
          </div>
        )}

        {/* Widgets temporarily disabled */}
      </div>
    </LayoutSidebar>
  );
}