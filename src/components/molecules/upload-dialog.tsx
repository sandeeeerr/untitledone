'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, FileAudio, Music, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useUploadProjectFile, useProjectVersions } from '@/lib/api/queries'

export type UploadDialogProps = {
	projectId: string
	trigger?: React.ReactNode
}

type FileToUpload = {
	file: File
	id: string
	version: number
	description: string
}

export default function UploadDialog({ projectId, trigger }: UploadDialogProps) {
	const [open, setOpen] = useState(false)
	const [files, setFiles] = useState<FileToUpload[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const [targetVersionId, setTargetVersionId] = useState<string | undefined>(undefined)
	const { toast } = useToast()
	const uploadFile = useUploadProjectFile(projectId)
	const { data: versions } = useProjectVersions(projectId)

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newFiles = acceptedFiles.map(file => ({
			file,
			id: crypto.randomUUID(),
			version: 1,
			description: `Uploaded ${file.name}`
		}))
		setFiles(prev => [...prev, ...newFiles])
	}, [])

	const removeFile = (id: string) => {
		setFiles(prev => prev.filter(f => f.id !== id))
	}

	const updateFile = (id: string, updates: Partial<FileToUpload>) => {
		setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
	}

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
				return <Download className="h-4 w-4 text-green-600" />
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	async function handleUpload() {
		if (files.length === 0) return

		setIsUploading(true)
		try {
			for (const fileToUpload of files) {
				await uploadFile.mutateAsync({
					filename: fileToUpload.file.name,
					fileSize: fileToUpload.file.size,
					fileType: fileToUpload.file.type || 'application/octet-stream',
					description: fileToUpload.description,
					versionId: targetVersionId,
				})
			}
			toast({ title: "Upload successful", description: `Uploaded ${files.length} file(s)` })
			setOpen(false)
			setFiles([])
		} catch {
			toast({ variant: "destructive", title: "Upload failed", description: "Failed to upload files. Please try again." })
		} finally {
			setIsUploading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					<Button size="sm" className="gap-2">
						<Upload className="h-4 w-4" />
						Upload Files
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl w-[calc(100%-1.5rem)] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Upload Files</DialogTitle>
					<DialogDescription>
						Upload audio files, project files, or other assets to this project.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Target version selector */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label className="text-xs">Target version</Label>
							<select
								className="h-9 text-sm w-full rounded-md border bg-background"
								value={targetVersionId ?? ''}
								onChange={(e) => setTargetVersionId(e.target.value || undefined)}
							>
								<option value="">Active version (default)</option>
								{(versions ?? []).map(v => (
									<option key={v.id} value={v.id}>{v.version_name} — {v.description}</option>
								))}
							</select>
						</div>
					</div>

					{/* Drag & Drop Zone */}
					<div
						className={cn(
							"border-2 border-dashed rounded-lg p-8 text-center transition-colors",
							"hover:border-primary/50 hover:bg-muted/50",
							"cursor-pointer"
						)}
						onClick={() => document.getElementById('file-input')?.click()}
					>
						<Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground mb-2">
							Drop files here or click to browse
						</p>
						<p className="text-xs text-muted-foreground">
							Supports: WAV, MP3, FLAC, MIDI, project files
						</p>
						<input id="file-input" type="file" multiple accept=".wav,.mp3,.flac,.aiff,.mid,.midi,.als,.flp,.logic,.ptx,.rpp" className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); onDrop(files) }} />
					</div>

					{/* File List */}
					{files.length > 0 && (
						<div className="space-y-3">
							<Label className="text-sm font-medium">Files to upload</Label>
							{files.map((fileToUpload) => (
								<div key={fileToUpload.id} className="border rounded-lg p-3 space-y-3">
									<div className="flex items-start gap-3">
										{getFileIcon(fileToUpload.file.name)}
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm truncate">{fileToUpload.file.name}</p>
											<p className="text-xs text-muted-foreground">{formatFileSize(fileToUpload.file.size)}</p>
										</div>
										<Button variant="ghost" size="sm" onClick={() => removeFile(fileToUpload.id)} className="h-6 w-6 p-0">
											<X className="h-3 w-3" />
										</Button>
									</div>

									<div>
										<Label htmlFor={`description-${fileToUpload.id}`} className="text-xs">Description</Label>
										<Textarea id={`description-${fileToUpload.id}`} value={fileToUpload.description} onChange={(e) => updateFile(fileToUpload.id, { description: e.target.value })} placeholder="Describe what this file contains..." className="h-16 text-sm resize-none" />
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isUploading}>Cancel</Button>
					<Button onClick={handleUpload} disabled={isUploading || files.length === 0} className="gap-2" size="sm">
						{isUploading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Uploading...</>) : (<><Upload className="h-4 w-4" />Upload {files.length} file{files.length !== 1 ? 's' : ''}</>)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
