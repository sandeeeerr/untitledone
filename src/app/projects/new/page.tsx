'use client'

import LayoutSidebar from '@/components/organisms/layout-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import ProjectForm, { type ProjectFormValues } from '@/components/organisms/project-form'
import { createProject } from '@/lib/api/projects'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function NewProjectPage() {
	const router = useRouter()
	const { toast } = useToast()
	const t = useTranslations('projects.new')

	async function onSubmit(values: ProjectFormValues) {
		try {
			const created = await createProject({
				name: values.name,
				description: values.description || undefined,
				tags: Array.isArray(values.tags) && values.tags.length ? values.tags : undefined,
				genre: values.genre || undefined,
				is_private: Boolean(values.is_private),
				downloads_enabled: Boolean(values.downloads_enabled),
				daw_name: values.daw_name || undefined,
				daw_version: values.daw_version || undefined,
				plugins: Array.isArray(values.plugins) && values.plugins.length
					? values.plugins.map((item) => {
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
			toast({ title: t('success.title'), description: t('success.description', { name: created.name }) })
			router.replace(`/projects/${created.id}`)
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : ''
			toast({ variant: 'destructive', title: t('error.title'), description: message || t('error.description') })
		}
	}

	return (
		<LayoutSidebar title={t('title')}>
			<div>
				<Card>
					<CardContent className="pt-6">
						<ProjectForm 
							submitLabel={t('actions.create')} 
							submittingLabel={t('actions.creating')} 
							cancelLabel={t('actions.cancel')} 
							onSubmit={onSubmit} 
							compact 
						/>
					</CardContent>
				</Card>
			</div>
		</LayoutSidebar>
	)
}