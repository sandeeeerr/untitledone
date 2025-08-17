'use client'

import { useEffect, useState } from 'react'
import LayoutSidebar from '@/components/layout-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/api/projects'
import { useToast } from '@/hooks/use-toast'

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return value
  }
}

export default function ProjectsPage() {
  const t = useTranslations('projects')
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)
        const data = await getProjects()
        setProjects(data)
      } catch (err: any) {
        setError(err?.message || t('error.loadFailed'))
        toast({
          variant: 'destructive',
          title: t('error.title'),
          description: err?.message || t('error.loadFailed')
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [toast, t])

  if (loading) {
    return (
      <LayoutSidebar
        title={t('title')}
        titleActions={
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new.title')}
            </Link>
          </Button>
        }
      >
        <div className="container py-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('loading')}</span>
          </div>
        </div>
      </LayoutSidebar>
    )
  }

  if (error) {
    return (
      <LayoutSidebar
        title={t('title')}
        titleActions={
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new.title')}
            </Link>
          </Button>
        }
      >
        <div className="container py-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              {t('error.tryAgain')}
            </Button>
          </div>
        </div>
      </LayoutSidebar>
    )
  }

  return (
    <LayoutSidebar
      title={t('title')}
      titleActions={
        <Button size="sm" asChild>
          <Link href="/projects/new">
          <Plus className="mr-2 h-4 w-4" />
            {t('new.title')}
          </Link>
        </Button>
      }
    >
      <div className="container py-4">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t('empty.message')}</p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('empty.createFirst')}
              </Link>
            </Button>
          </div>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-colors hover:bg-accent/5 cursor-pointer">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold truncate">{project.name}</CardTitle>
                    <Badge variant={project.is_private ? 'secondary' : 'default'}>
                      {project.is_private ? t('private') : t('public')}
                  </Badge>
                </CardHeader>
                <CardContent>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {project.genre && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('genre')}: {project.genre}
                      </p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{t('lastUpdated')}: {formatDate(project.updated_at)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        )}
      </div>
    </LayoutSidebar>
  )
} 