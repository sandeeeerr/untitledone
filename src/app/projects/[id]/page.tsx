'use client';

import { useEffect, useState, use } from 'react';
import LayoutSidebar from '@/components/layout-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Users, FileAudio, Loader2, Music, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProject, type Project } from '@/lib/api/projects';
import { useToast } from '@/hooks/use-toast';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('projects');
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = use(params);

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProject(id);
        setProject(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load project');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err?.message || 'Failed to load project'
        });
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
      titleActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <Button size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      }
    >
      <div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* DAW Info */}
              {project.daw_info && Object.keys(project.daw_info).length > 0 && (
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">DAW</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {project.daw_info.name}
                      {project.daw_info.version && ` v${project.daw_info.version}`}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Plugins */}
              {project.plugins_used && project.plugins_used.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Plugins</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.plugins_used.map((plugin, index) => (
                      <Badge key={index} variant="outline">
                        {plugin.name}
                        {plugin.version && ` v${plugin.version}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Content */}
          <Card>
            <CardHeader>
              <CardTitle>Project Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is where project tracks, files, and collaboration features would be displayed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutSidebar>
  );
} 