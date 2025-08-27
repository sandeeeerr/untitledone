'use client';

import React, { useDeferredValue, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileAudio, Music, Settings, Tags, Wrench, UserPlus, Clock, MessageSquare, Upload, Heart, Plus, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProject } from '@/lib/api/queries';
import { type Project } from '@/lib/api/projects';

import InviteDialog from '@/components/molecules/invite-dialog';
import UploadDialog from '@/components/molecules/upload-dialog';
import CreateVersionDialog from '@/components/molecules/create-version-dialog';
import { useProjectMembers } from '@/lib/api/queries';
import UserAvatar from '@/components/atoms/user-avatar';
import ProjectActivity from '@/components/organisms/project-activity';
import ProjectComments from '@/components/organisms/project-comments';
import ProjectFiles from '@/components/organisms/project-files';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/atoms/empty-state';
import LoadingState from '@/components/atoms/loading-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTimeAgo } from '@/lib/utils/date';
import { formatDAWInfo, hasDAWInfo, formatPlugin, getPluginKey } from '@/lib/utils/project';

interface ProjectDetailClientProps {
  id: string;
  initialProject?: Project;
}

export default function ProjectDetailClient({ id, initialProject }: ProjectDetailClientProps) {
  const t = useTranslations('projects');
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: project, isLoading, error, refetch } = useProject(id, initialProject);
  const { data: members } = useProjectMembers(id);
  
  const [activeTab, setActiveTab] = useState<'activity' | 'files' | 'comments'>('activity');
  const [activityQuery, setActivityQuery] = useState<string>("");
  const [filesQuery, setFilesQuery] = useState<string>("");
  const [activitySort, setActivitySort] = useState<'newest' | 'oldest'>('newest');
  const [filesSort, setFilesSort] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Use deferred values for smoother search experience
  const deferredActivityQuery = useDeferredValue(activityQuery);
  const deferredFilesQuery = useDeferredValue(filesQuery);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/projects');
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleVersionCreated = useCallback(() => {
    // This will trigger a refetch of the project data
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <LayoutSidebar title="Loading...">
        <div className="container">
          <LoadingState message="Loading project..." />
        </div>
      </LayoutSidebar>
    );
  }

  if (error || !project) {
    const errorMessage = error instanceof Error ? error.message : 'Project not found';
    return (
      <LayoutSidebar title="Error">
        <div className="container">
          <EmptyState
            title="Error"
            description={errorMessage}
            className="py-12"
          >
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry}>
                Try again
              </Button>
              <Button variant="outline" onClick={handleBack}>
                Back to projects
              </Button>
            </div>
          </EmptyState>
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar
      title="Project"
      breadcrumbLabelOverride={project.name}
      titleActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      }
    >
      <div className="container">
        <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column: overview + tabs + tab content */}
          <div className="xl:col-span-2">
            <div className="grid">
              {/* Project meta below title */}
              <div className="flex flex-col gap-2 mb-2">
                {/* Mobile: visibility tag above title */}
                <div className="flex items-center sm:hidden">
                  <Badge className={!project.is_private ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''} variant={project.is_private ? 'secondary' : 'default'}>
                    {project.is_private ? t('private') : t('public')}
                  </Badge>
                </div>
                {/* Title row with actions on the right */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-2xl font-semibold leading-tight truncate">{project.name}</h2>
                    {/* Desktop: visibility tag next to title */}
                    <Badge className={`hidden sm:inline-flex ${!project.is_private ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} variant={project.is_private ? 'secondary' : 'default'}>
                      {project.is_private ? t('private') : t('public')}
                    </Badge>
                  </div>
                  {currentUser?.id && project?.owner_id === currentUser.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/projects/${project.id}/edit`}>
                          <Settings className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <InviteDialog 
                        projectId={project.id} 
                        trigger={
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4" />
                            Invite
                          </Button>
                        } 
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <span>{project.genre || 'No genre'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>{project.likes_count ?? 0} Likes</span>
                </div>
              </div>

              {/* Details (mobile-only, under overview) */}
              <div className="xl:hidden">
                <Card className="mt-2">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-6">
                    {/* Project Description */}
                    {project.description && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Description</div>
                        <p className="text-sm leading-relaxed">{project.description}</p>
                      </div>
                    )}

                    {(project.tags?.length ?? 0) > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                          <Tags className="h-4 w-4" />
                          <span>Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          )) ?? null}
                        </div>
                      </div>
                    )}

                    {hasDAWInfo(project.daw_info) && (
                      <div>
                        <div className="text-sm text-muted-foreground">DAW</div>
                        <div className="font-medium">
                          {formatDAWInfo(project.daw_info)}
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
                          {project.plugins_used?.map((plugin, idx) => (
                            <Badge key={getPluginKey(plugin, idx)} variant="outline">
                              {formatPlugin(plugin)}
                            </Badge>
                          )) ?? null}
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
                          <Link 
                            key={m.user_id} 
                            href={`/u/${m.profile?.username || m.user_id}`}
                            className="hover:z-10 relative transition-transform hover:scale-110"
                            title={m.profile?.display_name || 'Team member'}
                          >
                            <UserAvatar
                              className="border-2 border-background h-8 w-8"
                              name={m.profile?.display_name}
                              username={m.profile?.username}
                              userId={m.user_id}
                              src={m.profile?.avatar_url}
                            />
                          </Link>
                        ))}
                        {(members?.length ?? 0) === 0 && (
                          <UserAvatar 
                            className="border-2 border-background h-8 w-8" 
                            name="Project Owner" 
                            username={null} 
                            userId={project.owner_id} 
                            src={null} 
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v: string) => setActiveTab(v as 'activity' | 'files' | 'comments')}
                className="w-full gap-4"
              >
                <div className="mt-6 md:mt-8 flex items-center justify-between border-b">
                  <TabsList className="grid w-auto grid-cols-3">
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> 
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-2">
                      <FileAudio className="h-4 w-4" /> 
                      Files
                    </TabsTrigger>
                    {/* Comments tab removed per new model */}
                  </TabsList>
                  <div className="hidden sm:block text-xs sm:text-sm text-muted-foreground">
                    {`Last update: ${formatTimeAgo(project.updated_at)}`}
                  </div>
                </div>

                {/* Toolbar under tabs */}
                <div className="mt-3 grid gap-2 sm:flex sm:items-center sm:justify-between">
                  <div className="w-full sm:flex-1 flex gap-2">
                    {activeTab === 'activity' && (
                      <>
                        <Input
                          placeholder="Search activity..."
                          aria-label="Search activity"
                          className="h-9 flex-1"
                          value={activityQuery}
                          onChange={(e) => setActivityQuery(e.target.value)}
                        />
                        <Select 
                          value={activitySort} 
                          onValueChange={(value: 'newest' | 'oldest') => setActivitySort(value)}
                        >
                          <SelectTrigger className="w-auto h-9 gap-1" aria-label="Sort activity">
                            <ArrowUpDown className="h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    {activeTab === 'files' && (
                      <>
                        <Input
                          placeholder="Search files..."
                          aria-label="Search files"
                          className="h-9 flex-1"
                          value={filesQuery}
                          onChange={(e) => setFilesQuery(e.target.value)}
                        />
                        <Select 
                          value={filesSort} 
                          onValueChange={(value: 'newest' | 'oldest' | 'name') => setFilesSort(value)}
                        >
                          <SelectTrigger className="w-auto h-9 gap-1" aria-label="Sort files">
                            <ArrowUpDown className="h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                            <SelectItem value="name">Name A-Z</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    {activeTab === 'comments' && (
                      <>
                        <Input
                          placeholder="Search comments..."
                          aria-label="Search comments"
                          className="h-9 flex-1"
                          disabled
                        />
                        <Select disabled>
                          <SelectTrigger className="w-auto h-9 gap-1" aria-label="Sort comments" disabled>
                            <ArrowUpDown className="h-4 w-4" />
                            <SelectValue placeholder="Newest first" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {activeTab === 'activity' && (
                      <CreateVersionDialog
                        projectId={project.id}
                        onVersionCreated={handleVersionCreated}
                        trigger={
                          <Button size="sm" className="h-9 gap-2 px-3 w-full sm:w-auto justify-center" aria-label="Create new version">
                            <Plus className="h-4 w-4" />
                            New Version
                          </Button>
                        }
                      />
                    )}
                    {activeTab === 'files' && project?.id && (
                      <UploadDialog
                        projectId={project.id}
                        trigger={
                          <Button size="sm" className="h-9 gap-2 px-3 w-full sm:w-auto justify-center" aria-label="Upload files">
                            <Upload className="h-4 w-4" />
                            Upload Files
                          </Button>
                        }
                      />
                    )}
                    {activeTab === 'comments' && (
                      <Button 
                        size="sm" 
                        className="h-9 gap-2 px-3 w-full sm:w-auto justify-center" 
                        aria-label="Add comment"
                        disabled
                      >
                        <MessageSquare className="h-4 w-4" />
                        Add Comment
                      </Button>
                    )}
                  </div>
                </div>

                <TabsContent value="activity" className="mt-4 px-0">
                  <ProjectActivity 
                    projectId={project.id} 
                    query={deferredActivityQuery} 
                    sortBy={activitySort}
                    onVersionCreated={handleVersionCreated}
                    members={members}
                  />
                </TabsContent>
                <TabsContent value="files" className="mt-4 px-0">
                  <ProjectFiles projectId={project.id} query={deferredFilesQuery} sortBy={filesSort} />
                </TabsContent>
                {/* Removed comments tab content */}
              </Tabs>
            </div>
          </div>

          {/* Right column: details sidebar (desktop-only) */}
          <div className="hidden xl:block xl:col-span-1">
            <Card>
              <CardHeader className="p-4 md:p-6 !pb-0">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                {/* Project Description */}
                {project.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Description</div>
                    <p className="text-sm leading-relaxed">{project.description}</p>
                  </div>
                )}

                {(project.tags?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Tags className="h-4 w-4" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      )) ?? null}
                    </div>
                  </div>
                )}

                {hasDAWInfo(project.daw_info) && (
                  <div>
                    <div className="text-sm text-muted-foreground">DAW</div>
                    <div className="font-medium">{formatDAWInfo(project.daw_info)}</div>
                  </div>
                )}

                {(project.plugins_used?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Wrench className="h-4 w-4" />
                      <span>Plugins</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.plugins_used?.map((plugin, idx) => (
                        <Badge key={getPluginKey(plugin, idx)} variant="outline">
                          {formatPlugin(plugin)}
                        </Badge>
                      )) ?? null}
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
                      <Link 
                        key={m.user_id} 
                        href={`/u/${m.profile?.username || m.user_id}`}
                        className="hover:z-10 relative transition-transform hover:scale-110"
                        title={m.profile?.display_name || 'Team member'}
                      >
                        <UserAvatar
                          className="border-2 border-background h-8 w-8"
                          name={m.profile?.display_name}
                          username={m.profile?.username}
                          userId={m.user_id}
                          src={m.profile?.avatar_url}
                        />
                      </Link>
                    ))}
                    {(members?.length ?? 0) === 0 && (
                      <UserAvatar 
                        className="border-2 border-background h-8 w-8" 
                        name="Project Owner" 
                        username={null} 
                        userId={project.owner_id} 
                        src={null} 
                      />
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
