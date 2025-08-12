'use client';

import LayoutSidebar from '@/components/layout-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Users, FileAudio } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectDetailPage({ params }: { params: any }) {
  const t = useTranslations('projects');
  const router = useRouter();

  const id: string = params?.id ?? '';

  const project = {
    id,
    name: `Project ${id}`,
    description: 'This is a sample project description for testing breadcrumbs.',
    visibility: 'public' as const,
    updatedAt: new Date().toISOString(),
    collaborators: 3,
    tracks: 5
  };

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
          <Button size="sm">Edit Project</Button>
        </div>
      }
    >
      <div className="container max-w-4xl py-8">
        <div className="grid gap-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'}>
                  {project.visibility === 'public' ? t('public') : t('private')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{project.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project.collaborators} collaborators</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileAudio className="h-4 w-4" />
                  <span>{project.tracks} tracks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for project content */}
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