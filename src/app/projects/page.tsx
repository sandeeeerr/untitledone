'use client'

import LayoutSidebar from '@/components/layout-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Dummy data
type Project = {
  id: string
  name: string
  updatedAt: string
  visibility: 'private' | 'public'
}

const projects: Project[] = [
  { id: '1', name: 'EP Release 2025', updatedAt: '2025-08-01T12:30:00Z', visibility: 'private' },
  { id: '2', name: 'Remix Pack – Summer', updatedAt: '2025-07-22T08:10:00Z', visibility: 'public' },
  { id: '3', name: 'Live Set Utrecht', updatedAt: '2025-06-15T18:00:00Z', visibility: 'private' },
  { id: '4', name: 'Collab w/ Nora', updatedAt: '2025-07-30T09:00:00Z', visibility: 'public' },
  { id: '5', name: 'Synth Presets', updatedAt: '2025-05-21T14:00:00Z', visibility: 'public' },
]

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

  return (
    <LayoutSidebar
      title={t('title')}
      titleActions={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('new')}
        </Button>
      }
    >
      <div className="container py-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <Card key={project.id} className="transition-colors hover:bg-accent/5">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold truncate">{project.name}</CardTitle>
                <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'}>
                  {project.visibility === 'public' ? t('public') : t('private')}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('lastUpdated')}: {formatDate(project.updatedAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </LayoutSidebar>
  )
} 