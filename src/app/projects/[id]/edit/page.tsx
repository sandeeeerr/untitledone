'use client'

import { use, useEffect, useState } from 'react'
import LayoutSidebar from '@/components/layout-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import ProjectForm, { type ProjectFormValues } from '@/components/project-form'
import { getProject, updateProject, type Project } from '@/lib/api/projects'
import { useTranslations } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
	const t = useTranslations('projects.edit')
	const { toast } = useToast()
	const router = useRouter()
	const [project, setProject] = useState<Project | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const { id } = use(params)

	useEffect(() => {
		async function fetchProject() {
			try {
				setLoading(true)
				setError(null)
				const data = await getProject(id)
				setProject(data)
			} catch (err: any) {
				setError(err?.message || 'Failed to load project')
				toast({ variant: 'destructive', title: t('error.title', { default: 'Error' }) as any, description: err?.message || t('error.description', { default: 'Failed to load project' }) as any })
			} finally {
				setLoading(false)
			}
		}
		if (id) fetchProject()
	}, [id, toast, t])

	async function onSubmit(values: ProjectFormValues) {
		try {
			await updateProject(id, {
				name: values.name,
				description: values.description || undefined,
				tags: values.tags ? values.tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
				genre: values.genre || undefined,
				is_private: Boolean(values.is_private),
				downloads_enabled: Boolean(values.downloads_enabled),
				daw_name: values.daw_name || undefined,
				daw_version: values.daw_version || undefined,
				plugins: values.plugins
					? values.plugins.split(',').map(item => {
						const trimmed = item.trim()
						const atParts = trimmed.split('@')
						if (atParts.length === 2) return { name: atParts[0].trim(), version: atParts[1].trim() }
						const colonParts = trimmed.split(':')
						if (colonParts.length === 2) return { name: colonParts[0].trim(), version: colonParts[1].trim() }
						const vMatch = trimmed.match(/^(.*)\s+v(\S+)$/i)
						if (vMatch) return { name: vMatch[1].trim(), version: vMatch[2].trim() }
						return { name: trimmed }
					})
				: undefined,
			})
			toast({ title: t('success.title'), description: t('success.description', { name: values.name }) })
			router.replace(`/projects/${id}`)
		} catch (err: any) {
			toast({ variant: 'destructive', title: t('error.title'), description: err?.message || t('error.description') })
		}
	}

	if (loading) {
		return (
			<LayoutSidebar title={t('title')}>
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin" />
					<span className="ml-2">{t('loading')}</span>
				</div>
			</LayoutSidebar>
		)
	}

	if (error || !project) {
		return (
			<LayoutSidebar title={t('title')}>
				<div className="text-center py-12">
					<p className="text-muted-foreground mb-4">{error || t('error.description')}</p>
				</div>
			</LayoutSidebar>
		)
	}

	const initial: ProjectFormValues = {
		name: project.name,
		description: project.description ?? '',
		tags: (project.tags || []).join(', '),
		genre: project.genre ?? '',
		is_private: project.is_private,
		downloads_enabled: project.downloads_enabled,
		daw_name: (project as any).daw_info?.name ?? '',
		daw_version: (project as any).daw_info?.version ?? '',
		plugins: (project.plugins_used || [])
			.map(p => (p.version ? `${p.name}@${p.version}` : p.name))
			.join(', '),
	}

	return (
		<LayoutSidebar 
			title={t('title')}
			breadcrumbLabelOverride={project.name}
		>
			<div>
				<Card>
					<CardContent className="pt-6">
						<ProjectForm 
							initialValues={initial}
							submitLabel={t('actions.save')}
							submittingLabel={t('actions.saving')}
							cancelLabel={t('actions.cancel')}
							onSubmit={onSubmit}
						/>
					</CardContent>
				</Card>
			</div>
		</LayoutSidebar>
	)
}


