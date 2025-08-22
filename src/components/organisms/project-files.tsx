"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileAudio, Music } from 'lucide-react'
import VersionAccordion from '@/components/molecules/version-accordion'
import FileCard from '@/components/molecules/file-card'
import { useProjectFiles } from '@/lib/api/queries'
import FileDrawer from '@/components/organisms/file-drawer'

export default function ProjectFiles({ projectId, query }: { projectId: string; query?: string }) {
	const { data: files, isLoading, error } = useProjectFiles(projectId)
	const [openKeys, setOpenKeys] = React.useState<Set<string>>(new Set())
	const [drawerOpen, setDrawerOpen] = React.useState(false)
	const [selectedFileId, setSelectedFileId] = React.useState<string | null>(null)

	const normalizedQuery = (query ?? '').trim().toLowerCase()
	const baseFiles = files ?? []
	const filtered = !normalizedQuery
		? baseFiles
		: baseFiles.filter(f => {
				const hay = [f.filename, f.uploadedBy?.name || '', f.description || '', f.versionName || ''].join(' ').toLowerCase()
				return hay.includes(normalizedQuery)
			})

	const getFileIcon = (filename: string) => {
		const extension = filename.split('.').pop()?.toLowerCase()
		switch (extension) {
			case 'wav':
			case 'mp3':
			case 'flac':
				return <FileAudio className="h-4 w-4 text-green-600" />
			case 'mid':
			case 'midi':
				return <Music className="h-4 w-4 text-green-600" />
			case 'als':
			case 'flp':
			default:
				return <FileAudio className="h-4 w-4 text-blue-600" />
		}
	}

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

	// Group by version name (null -> Unversioned)
	const groups = new Map<string, typeof filtered>()
	for (const f of filtered) {
		const key = f.versionName ?? 'Unversioned'
		const arr = groups.get(key) ?? []
		arr.push(f)
		groups.set(key, arr)
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
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
					</div>
				</CardContent>
			</Card>
		)
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
		)
	}

	if (!filtered || filtered.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Files</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<FileAudio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground mb-2">No files found</p>
						<p className="text-xs text-muted-foreground">Try a different query or upload a new file</p>
					</div>
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
									onClick={() => { setSelectedFileId(file.id); setDrawerOpen(true); }}
								/>
							))}
						</div>
					</VersionAccordion>
				)
			})}
			<FileDrawer
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
				file={selectedFileId ? (() => { const f = (files ?? []).find(x => x.id === selectedFileId); return f ? ({ id: f.id, filename: f.filename, description: f.description, fileSizeLabel: formatFileSize(f.fileSize), dateLabel: formatDate(f.uploadedAt), uploadedByName: f.uploadedBy?.name, versionName: f.versionName ?? null }) : undefined })() : undefined}
			/>
		</div>
	)
}
