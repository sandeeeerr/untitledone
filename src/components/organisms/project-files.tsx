"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileAudio } from 'lucide-react'
import { FileCardSkeletonGrid } from '@/components/atoms/skeletons'
import { getFileIconForName } from '@/lib/ui/file-icons'
import VersionAccordion from '@/components/molecules/version-accordion'
import FileCard from '@/components/molecules/file-card'
import { useProjectFiles, useProject } from '@/lib/api/queries'
// import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EmptyState from '@/components/atoms/empty-state'

export default function ProjectFiles({ projectId, query, sortBy = 'newest' }: { projectId: string; query?: string; sortBy?: 'newest' | 'oldest' | 'name' }) {
	const { data: files, isLoading, error } = useProjectFiles(projectId)
  const { data: project } = useProject(projectId)
	const t = useTranslations()
	const [openKeys, setOpenKeys] = React.useState<Set<string>>(new Set())
  const router = useRouter()

	const normalizedQuery = (query ?? '').trim().toLowerCase()
	const baseFiles = files ?? []
	
	// Apply sorting
	const sortedFiles = [...baseFiles].sort((a, b) => {
		switch (sortBy) {
			case 'oldest':
				return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
			case 'name':
				return a.filename.toLowerCase().localeCompare(b.filename.toLowerCase())
			case 'newest':
			default:
				return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
		}
	})
	
	const filtered = !normalizedQuery
		? sortedFiles
		: sortedFiles.filter(f => {
				const hay = [f.filename, f.uploadedBy?.name || '', f.description || '', f.versionName || ''].join(' ').toLowerCase()
				return hay.includes(normalizedQuery)
			})

	const getFileIcon = (filename: string) => getFileIconForName(filename, { className: 'h-4 w-4' })

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
	}

  // Group by version name (null -> Unversioned). Include empty versions so they show up.
  const groups = new Map<string, typeof filtered>()
  // Seed groups with known version names from activity or versions if available in project context
  const knownVersionNames = new Set<string>()
  // Try to infer from files first
  for (const f of baseFiles) {
    if (f.versionName) knownVersionNames.add(f.versionName)
  }
  if (project?.status) {
    // no-op placeholder; status unused
  }
  // Place files into groups
  for (const f of filtered) {
    const key = f.versionName ?? 'Unversioned'
    const arr = groups.get(key) ?? []
    arr.push(f)
    groups.set(key, arr)
    knownVersionNames.add(key)
  }

  const orderedGroupKeys = Array.from(groups.keys()).sort((a, b) => {
		if (a === 'Unversioned') return 1
		if (b === 'Unversioned') return -1
		return b.localeCompare(a, undefined, { numeric: true })
	})

	// Ensure at least the first group is open on first render
	React.useEffect(() => {
		if (openKeys.size === 0 && orderedGroupKeys.length > 0) {
			setOpenKeys(new Set([orderedGroupKeys[0]]))
		}
	}, [orderedGroupKeys, openKeys])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <FileCardSkeletonGrid count={6} />
        </CardContent>
      </Card>
    )
  }

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t("files.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-red-600">{t("files.loadError")}. {t("projects.actions.tryAgain")}.</p>
				</CardContent>
			</Card>
		)
	}

	if (!filtered || filtered.length === 0) {
		const isFiltered = normalizedQuery.length > 0
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t("files.title")}</CardTitle>
				</CardHeader>
				<CardContent className="p-4 md:p-6">
					<EmptyState 
						icon={<FileAudio className="h-12 w-12" />} 
						title={isFiltered ? t('files.noFilesFound') : t('files.noFilesYet')} 
						description={isFiltered ? t('files.tryDifferentSearchTerm') : t('files.uploadFilesToStart')} 
					/>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{orderedGroupKeys.map((key) => {
				const filesInGroup = groups.get(key) ?? []
				const isOpen = openKeys.has(key)
				const isActive = key !== 'Unversioned' && orderedGroupKeys.indexOf(key) === 0
				return (
					<VersionAccordion
						key={key}
						versionLabel={key}
						fileCount={filesInGroup.length}
						isOpen={isOpen}
						isActive={isActive}
						onToggle={() => setOpenKeys(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; })}
					>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{filesInGroup.map((file) => (
								<FileCard
									key={file.id}
									filename={file.filename}
									description={file.description}
									fileSizeLabel={formatFileSize(file.fileSize)}
									dateLabel={formatDate(file.uploadedAt)}
									icon={getFileIcon(file.filename)}
									downloadDisabled={project ? !project.downloads_enabled : false}
									onClick={() => router.push(`/projects/${projectId}/files/${file.id}`)}
									onDownload={async () => {
										try {
											const res = await fetch(`/api/projects/${projectId}/files/${file.id}?action=download`, { method: 'POST' })
											if (!res.ok) throw new Error('Failed to get download URL')
											const { url } = await res.json()
											window.open(url, '_blank')
										} catch {}
									}}
								/>
							))}
						</div>
					</VersionAccordion>
				)
			})}
			{/* Drawer removed; cards link directly to the file detail page */}
		</div>
	)
}
