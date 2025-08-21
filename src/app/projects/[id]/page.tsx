'use client';

import { useEffect, useState, use } from 'react';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileAudio, Loader2, Music, Settings, Tags, Wrench, UserPlus, Clock, MessageSquare, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getProject, type Project } from '@/lib/api/projects';
import { useToast } from '@/hooks/use-toast';
import InviteDialog from '@/components/molecules/invite-dialog';
import UploadDialog from '@/components/molecules/upload-dialog';
import { useProjectMembers, useProjectFiles } from '@/lib/api/queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProjectActivity, { type ProjectActivityVersion } from '@/components/organisms/project-activity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('projects');
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();
  const { id } = use(params);
  const { data: members } = useProjectMembers(id);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'files' | 'comments'>('activity');
  const [activityQuery, setActivityQuery] = useState<string>("");
  const demoActivity: ProjectActivityVersion[] = [
    {
      version: 'v2.0',
      description: 'Final mix door Julia',
      author: 'Julia',
      date: '2024-01-15',
      avatar: null,
      microChanges: [
        { id: '1', type: 'addition', description: 'Reverb toegevoegd op vocals', author: 'Julia', time: '16:45', avatar: null },
        { id: '2', type: 'feedback', description: 'Bass levels zijn perfect nu', author: 'Sam', time: '17:12', avatar: null },
        { id: '3', type: 'update', description: 'Master limiter aangepast', author: 'Julia', time: '17:30', avatar: null },
      ],
    },
    {
      version: 'v1.0',
      description: 'Rough sketch door Sam',
      author: 'Sam',
      date: '2024-01-12',
      avatar: null,
      microChanges: [
        { id: '4', type: 'addition', description: 'Bassline toegevoegd', author: 'Julia', time: '14:12', avatar: null },
        { id: '5', type: 'feedback', description: 'Kick is te droog', author: 'Sam', time: '14:28', avatar: null },
        { id: '6', type: 'addition', description: 'Vocal take toegevoegd', author: 'Esther', time: '15:01', avatar: null },
        { id: '7', type: 'update', description: 'Drum pattern aangepast', author: 'Sam', time: '15:45', avatar: null },
      ],
    },
  ];

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProject(id);
        setProject(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load project';
        setError(message);
        toast({ variant: 'destructive', title: 'Error', description: message });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProject();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <LayoutSidebar title="Loading...">
        <div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading project...</span>
          </div>
        </div>
      </LayoutSidebar>
    );
  }

  if (error || !project) {
    return (
      <LayoutSidebar title="Error">
        <div >
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {error || 'Project not found'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/projects">
                  Back to projects
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar
      title={project.name}
      breadcrumbLabelOverride={project.name}
      titleActions={
        <div className="flex gap-2">
          {currentUser?.id && project?.owner_id === currentUser.id && (
            <>
              <Button size="sm" asChild>
                <Link href={`/projects/${project.id}/edit`}>
                  <Settings className=" h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <InviteDialog projectId={project.id} trigger={<Button variant="outline" size="sm"><UserPlus className="h-4 w-4" />Invite</Button>} />
            </>
          )}
        </div>
      }
    >
      <div className="py-2">
        <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column: overview + tabs + tab content */}
          <div className="xl:col-span-2">
            <div className="grid gap-6">
              {/* Project Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                    <Badge variant={project.is_private ? 'secondary' : 'default'}>
                      {project.is_private ? t('private') : t('public')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-muted-foreground">{project.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Music className="h-4 w-4" />
                      <span>{project.genre || 'No genre'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileAudio className="h-4 w-4" />
                      <span>{project.likes_count} likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details (mobile-only, under overview) */}
              <div className="xl:hidden">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(project.tags?.length ?? 0) > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                          <Tags className="h-4 w-4" />
                          <span>Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {((project.daw_info as { name?: string; version?: string })?.name || (project.daw_info as { name?: string; version?: string })?.version) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">DAW Name</div>
                          <div className="font-medium">{(project.daw_info as { name?: string; version?: string })?.name || '-'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">DAW Version</div>
                          <div className="font-medium">{(project.daw_info as { name?: string; version?: string })?.version || '-'}</div>
                        </div>
                      </div>
                    )}

                    {(project.plugins_used?.length ?? 0) > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                          <Wrench className="h-4 w-4" />
                          <span>Plugins</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.plugins_used.map((p, idx) => (
                            <Badge key={`${p.name}-${p.version ?? idx}`} variant="outline">
                              {p.name}{p.version ? ` @ ${p.version}` : ''}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                        <UserPlus className="h-4 w-4" />
                        <span>Team</span>
                      </div>
                      <div className="flex -space-x-2">
                        {(members ?? []).slice(0, 6).map(m => (
                          <Avatar key={m.user_id} className="border-2 border-background h-8 w-8">
                            <AvatarImage src={m.profile?.avatar_url || undefined} alt={m.profile?.display_name || m.profile?.username || m.user_id} />
                            <AvatarFallback>{(m.profile?.display_name || m.profile?.username || m.user_id).slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {(members?.length ?? 0) === 0 && (
                          <Avatar className="border-2 border-background h-8 w-8"><AvatarFallback>UO</AvatarFallback></Avatar>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v: string) => setActiveTab(v as 'overview' | 'activity' | 'files' | 'comments')}
                className="w-full"
              >
                <div className="flex items-center justify-between gap-2">
                  <TabsList className="p-1">
                    <TabsTrigger value="activity" className="px-2.5 sm:px-3">
                      <span className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" /> Activity
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="files" className="px-2.5 sm:px-3">
                      <span className="flex items-center gap-2 text-sm">
                        <FileAudio className="h-4 w-4" /> Files
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="px-2.5 sm:px-3">
                      <span className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4" /> Comments
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Upload button - always visible */}
                  <UploadDialog projectId={id} />

                  {/* Activity search */}
                  {activeTab === 'activity' && (
                    <div className="relative w-64 hidden sm:block">
                      <Input
                        placeholder="Search activity..."
                        className="h-10"
                        onChange={(e) => setActivityQuery(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <TabsContent value="activity" className="mt-4">
                  <ProjectActivity
                    versions={demoActivity}
                    locale={Intl.DateTimeFormat().resolvedOptions().locale}
                    query={activityQuery}
                  />
                </TabsContent>
                <TabsContent value="files" className="mt-4">
                  <ProjectFiles projectId={id} />
                </TabsContent>
                <TabsContent value="comments" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Nog geen reacties.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right column: details sidebar (desktop-only) */}
          <div className="hidden xl:block xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(project.tags?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Tags className="h-4 w-4" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {((project.daw_info as { name?: string; version?: string })?.name || (project.daw_info as { name?: string; version?: string })?.version) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">DAW Name</div>
                      <div className="font-medium">{(project.daw_info as { name?: string; version?: string })?.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">DAW Version</div>
                      <div className="font-medium">{(project.daw_info as { name?: string; version?: string })?.version || '-'}</div>
                    </div>
                  </div>
                )}

                {(project.plugins_used?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Wrench className="h-4 w-4" />
                      <span>Plugins</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.plugins_used.map((p, idx) => (
                        <Badge key={`${p.name}-${p.version ?? idx}`} variant="outline">
                          {p.name}{p.version ? ` @ ${p.version}` : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <UserPlus className="h-4 w-4" />
                    <span>Team</span>
                  </div>
                  <div className="flex -space-x-2">
                    {(members ?? []).slice(0, 6).map(m => (
                      <Avatar key={m.user_id} className="border-2 border-background h-8 w-8">
                        <AvatarImage src={m.profile?.avatar_url || undefined} alt={m.profile?.display_name || m.profile?.username || m.user_id} />
                        <AvatarFallback>{(m.profile?.display_name || m.profile?.username || m.user_id).slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    {(members?.length ?? 0) === 0 && (
                      <Avatar className="border-2 border-background h-8 w-8"><AvatarFallback>UO</AvatarFallback></Avatar>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutSidebar>
  );
}

function ProjectFiles({ projectId }: { projectId: string }) {
  const { data: files, isLoading, error } = useProjectFiles(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load files. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileAudio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No files uploaded yet</p>
            <p className="text-xs text-muted-foreground">Upload your first file to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'wav':
      case 'mp3':
      case 'flac':
        return <FileAudio className="h-4 w-4 text-green-600" />;
      case 'mid':
      case 'midi':
        return <Music className="h-4 w-4 text-green-600" />;
      case 'als':
      case 'flp':
      default:
        return <FileAudio className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Files ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              {getFileIcon(file.filename)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{file.filename}</p>
                  <Badge variant="secondary" className="text-xs">
                    v{file.version}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>•</span>
                  <span>{file.uploadedBy.name}</span>
                  <span>•</span>
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
                {file.description && (
                  <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <FileAudio className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 