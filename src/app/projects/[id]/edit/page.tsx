'use client'

import { use, useEffect, useMemo, useState } from 'react'
import LayoutSidebar from '@/components/organisms/layout-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import ProjectForm, { type ProjectFormValues } from '@/components/organisms/project-form'
import { getProject, updateProject, type Project } from '@/lib/api/projects'
import { useTranslations } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ShareLinksManager, ShareLink } from '@/components/organisms/share-links-manager'
import { useQuery } from '@tanstack/react-query'
// Removed InviteDialog usage on edit page per request

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
	const t = useTranslations('projects.edit')
	const { toast } = useToast()
	const router = useRouter()
	const [project, setProject] = useState<Project | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { data: currentUser } = useCurrentUser()

	const { id } = use(params)

	// Fetch share links for this project
	const { data: shareLinks = [], isLoading: isLoadingLinks } = useQuery<ShareLink[]>({
		queryKey: ["share-links", id],
		queryFn: async () => {
			const response = await fetch(`/api/projects/${id}/share-links`);
			if (!response.ok) {
				throw new Error("Failed to fetch share links");
			}
			return response.json();
		},
		enabled: Boolean(id),
	});

	useEffect(() => {
		async function fetchProject() {
			try {
				setLoading(true)
				setError(null)
				const data = await getProject(id)
				setProject(data)
			} catch (err: unknown) {
				const errorMessage = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : 'Failed to load project'
				setError(errorMessage)
				toast({ variant: 'destructive', title: t('error.title', { default: 'Error' }), description: errorMessage })
			} finally {
				setLoading(false)
			}
		}
		if (id) fetchProject()
	}, [id, toast, t])

	// Guard: only owners can access edit page
	const isOwner = useMemo(() => {
		return Boolean(project && currentUser && project.owner_id === currentUser.id)
	}, [project, currentUser])

	useEffect(() => {
		if (!loading && project && currentUser && !isOwner) {
			toast({ variant: 'destructive', title: t('error.title', { default: 'Error' }), description: t('error.forbidden', { default: 'You are not allowed to edit this project.' }) })
			router.replace(`/projects/${id}`)
		}
	}, [loading, project, currentUser, isOwner, router, id, t, toast])

	async function onSubmit(values: ProjectFormValues) {
		try {
			await updateProject(id, {
				name: values.name,
				description: values.description || undefined,
				tags: Array.isArray(values.tags) && values.tags.length ? values.tags : undefined,
				genre: values.genre || undefined,
				is_private: Boolean(values.is_private),
				downloads_enabled: Boolean(values.downloads_enabled),
				daw_name: values.daw_name || undefined,
				daw_version: values.daw_version || undefined,
				plugins: Array.isArray(values.plugins) && values.plugins.length
					? values.plugins.map(item => {
						const trimmed = String(item).trim()
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
		} catch (err: unknown) {
			const errorMessage = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : 'Failed to update project'
			toast({ variant: 'destructive', title: t('error.title'), description: errorMessage })
		}
	}

	// Invitation-related queries
	// const { data: invites } = useProjectInvitations(id)
	// const { data: members } = useProjectMembers(id)

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

	// Not owner: avoid flicker
	if (!isOwner) {
		return (
			<LayoutSidebar title={t('title')}>
				<div className="text-center py-12">
					<p className="text-muted-foreground mb-4">{t('error.forbidden', { default: 'You are not allowed to edit this project.' })}</p>
				</div>
			</LayoutSidebar>
		)
	}

	const initial: ProjectFormValues = {
		name: project.name,
		description: project.description ?? '',
		tags: (project.tags || []),
		genre: project.genre ?? '',
		is_private: project.is_private,
		downloads_enabled: project.downloads_enabled,
		daw_name: (project.daw_info as { name?: string; version?: string })?.name ?? '',
		daw_version: (project.daw_info as { name?: string; version?: string })?.version ?? '',
	plugins: (project.plugins_used || [])
			.map(p => (p.version ? `${p.name}@${p.version}` : p.name)),
	}



	return (
		<LayoutSidebar 
			title={t('title')}
			breadcrumbLabelOverride="Edit"
			projectIdForBreadcrumb={id}
			titleActions={
				<button 
					onClick={() => router.push(`/projects/${id}`)}
					className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
				>
					← {t('actions.cancel', { default: 'Cancel' })}
				</button>
			}
		>
			<div className="space-y-6">
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

				{/* Share Links Manager */}
				<Card>
					<CardContent className="pt-6">
						<ShareLinksManager
							projectId={id}
							initialLinks={shareLinks}
							isLoading={isLoadingLinks}
						/>
					</CardContent>
				</Card>
			</div>
		</LayoutSidebar>
	)
}


