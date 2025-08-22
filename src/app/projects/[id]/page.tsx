'use client';

import React, { useEffect, useState, use } from 'react';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileAudio, Loader2, Music, Settings, Tags, Wrench, UserPlus, Clock, MessageSquare, Download, Plus, Upload, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getProject, type Project } from '@/lib/api/projects';
import { useToast } from '@/hooks/use-toast';
import InviteDialog from '@/components/molecules/invite-dialog';
import UploadDialog from '@/components/molecules/upload-dialog';
import CreateVersionDialog from '@/components/molecules/create-version-dialog';
import { useProjectMembers, useProjectFiles, useProjectActivity } from '@/lib/api/queries';
import UserAvatar from '@/components/atoms/user-avatar';
import ProjectActivity from '@/components/organisms/project-activity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
// removed motion underline for tabs

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
  
  // Replace hardcoded demoActivity with real data
  const { data: activity, isLoading: activityLoading, error: activityError } = useProjectActivity(id);


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
      title={"Project"}
      breadcrumbLabelOverride={project.name}
      titleActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>

        </div>
      }
    >

        <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column: overview + tabs + tab content */}
          <div className="xl:col-span-2">
            <div className="grid">
              {/* Project meta below title */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-2xl font-semibold leading-tight truncate">{project.name}</h2>
                  <Badge variant={project.is_private ? 'secondary' : 'default'}>
                    {project.is_private ? t('private') : t('public')}
                  </Badge>
                </div>
                {currentUser?.id && project?.owner_id === currentUser.id && (
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-end">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/projects/${project.id}/edit`}>
                        <Settings className=" h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <InviteDialog projectId={project.id} trigger={<Button variant="outline" size="sm"><UserPlus className="h-4 w-4" />Invite</Button>} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground ">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <span>{project.genre || 'No genre'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>{project.likes_count} Likes</span>
                </div>
              </div>

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
                          <UserAvatar
                            key={m.user_id}
                            className="border-2 border-background h-8 w-8"
                            name={m.profile?.display_name}
                            username={m.profile?.username}
                            userId={m.user_id}
                            src={m.profile?.avatar_url}
                          />
                        ))}
                        {(members?.length ?? 0) === 0 && (
                          <UserAvatar className="border-2 border-background h-8 w-8" name={"UntitledOne"} username={"uo"} userId={"placeholder"} src={null} />
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
                className="w-full gap-4"
              >
                <div className="mt-6 md:mt-8 flex items-center justify-between border-b">
                  <TabsList className="bg-background relative rounded-none border-b-0 p-0 w-auto">
                    <TabsTrigger
                      value="activity"
                      className="relative -mb-[2px] border-b-2 border-transparent data-[state=active]:border-primary px-3 sm:px-4"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" /> Activity
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="files"
                      className="bg-background dark:data-[state=active]:bg-background relative z-10 rounded-none data-[state=active]:shadow-none px-3 sm:px-4 -mb-[2px] border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <FileAudio className="h-4 w-4" /> Files
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="bg-background dark:data-[state=active]:bg-background relative z-10 rounded-none data-[state=active]:shadow-none px-3 sm:px-4 -mb-[2px] border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4" /> Comments
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {`Last update: ${new Date(project.updated_at).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}`}
                  </div>
                </div>

                {/* Toolbar under tabs */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    {activeTab === 'activity' && (
                      <div className="w-full max-w-sm">
                        <Input
                          placeholder="Search activity..."
                          className="h-9"
                          onChange={(e) => setActivityQuery(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CreateVersionDialog
                      projectId={project.id}
                      trigger={
                        <Button>
                          <Plus className="h-4 w-4" />
                          Add new version
                        </Button>
                      }
                    />
                  </div>
                </div>

                <TabsContent value="activity" className="mt-4">
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading activity...</span>
                    </div>
                  ) : activityError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-red-600 mb-4">Failed to load activity</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <ProjectActivity
                      versions={activity || []}
                      locale={Intl.DateTimeFormat().resolvedOptions().locale}
                      query={activityQuery}
                    />
                  )}
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
                      <UserAvatar
                        key={m.user_id}
                        className="border-2 border-background h-8 w-8"
                        name={m.profile?.display_name}
                        username={m.profile?.username}
                        userId={m.user_id}
                        src={m.profile?.avatar_url}
                      />
                    ))}
                    {(members?.length ?? 0) === 0 && (
                      <UserAvatar className="border-2 border-background h-8 w-8" name={"UntitledOne"} username={"uo"} userId={"placeholder"} src={null} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  {file.versionName && (
                    <Badge variant="secondary" className="text-xs">
                      {file.versionName}
                    </Badge>
                  )}
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

