'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, HardDrive } from 'lucide-react'
import { FaDropbox, FaGoogleDrive } from 'react-icons/fa'
import { getFileIconForName } from '@/lib/ui/file-icons'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useUploadProjectFile, useStorageConnections } from '@/lib/api/queries'
import Link from 'next/link'

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
	const [selectedProvider, setSelectedProvider] = useState<'local' | 'dropbox' | 'google_drive'>('local')
	// Removed targetVersionId; server will link to active version if any
	const { toast } = useToast()
	const uploadFile = useUploadProjectFile(projectId)
	const { data: connections, isLoading: loadingConnections } = useStorageConnections()
	// No version fetching

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newFiles = acceptedFiles.map(file => ({
			file,
			id: crypto.randomUUID(),
			version: 1,
			description: ''
		}))
		setFiles(prev => [...prev, ...newFiles])
	}, [])

	const removeFile = (id: string) => {
		setFiles(prev => prev.filter(f => f.id !== id))
	}

	const updateFile = (id: string, updates: Partial<FileToUpload>) => {
		setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
	}

	const getFileIcon = (filename: string) => getFileIconForName(filename, { className: 'h-4 w-4' })

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	// Determine available providers
	const dropboxConnected = connections?.find(c => c.provider === 'dropbox' && c.status === 'active')
	const driveConnected = connections?.find(c => c.provider === 'google_drive' && c.status === 'active')

	async function handleUpload() {
		if (files.length === 0) return

		setIsUploading(true)
		try {
			for (const fileToUpload of files) {
				await uploadFile.mutateAsync({
					file: fileToUpload.file,
					description: fileToUpload.description,
					storageProvider: selectedProvider,
				})
			}
			// Don't show toast here - mutation hook already shows success toast
			setOpen(false)
			setFiles([])
			setSelectedProvider('local') // Reset to default
		} catch (error) {
			// Check for specific error codes
			if (error instanceof Error) {
				if (error.message.includes('PROVIDER_NOT_CONNECTED')) {
					toast({ 
						variant: "destructive", 
						title: "Upload failed", 
						description: "Please connect your storage provider in Settings" 
					})
					return
				}
				if (error.message.includes('PROVIDER_TOKEN_EXPIRED')) {
					toast({ 
						variant: "destructive", 
						title: "Upload failed", 
						description: "Your storage provider connection expired. Please reconnect in Settings." 
					})
					return
				}
			}
			// Don't show generic toast here - mutation hook already shows error toast
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
					{/* Storage Provider Selection */}
					<div className="space-y-2">
						<Label htmlFor="storage-provider" className="text-sm font-medium">
							Storage Location
						</Label>
						<Select 
							value={selectedProvider} 
							onValueChange={(value) => setSelectedProvider(value as 'local' | 'dropbox' | 'google_drive')}
							disabled={isUploading || loadingConnections}
						>
							<SelectTrigger id="storage-provider" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="local">
									<div className="flex items-center gap-2">
										<HardDrive className="h-4 w-4" />
										<span>Local Storage</span>
									</div>
								</SelectItem>
								<SelectItem value="dropbox" disabled={!dropboxConnected}>
									<div className="flex items-center gap-2">
										<FaDropbox className="h-4 w-4 text-[#0061FF]" />
										<span>Dropbox</span>
										{!dropboxConnected && <span className="text-xs text-muted-foreground">(Not connected)</span>}
									</div>
								</SelectItem>
								<SelectItem value="google_drive" disabled={!driveConnected}>
									<div className="flex items-center gap-2">
										<FaGoogleDrive className="h-4 w-4 text-[#4285F4]" />
										<span>Google Drive</span>
										{!driveConnected && <span className="text-xs text-muted-foreground">(Not connected)</span>}
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
						{selectedProvider === 'local' ? (
							<div className="rounded-md bg-muted p-3 space-y-1">
								<p className="text-xs text-muted-foreground">
									📊 Using your <strong>50 MB platform quota</strong>
								</p>
								<p className="text-xs text-muted-foreground">
									Want unlimited space? <Link href="/settings/storage" className="underline hover:text-foreground font-medium">Connect Dropbox or Google Drive</Link>
								</p>
							</div>
						) : selectedProvider === 'dropbox' ? (
							<div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 p-3 space-y-1">
								<p className="text-xs text-blue-900 dark:text-blue-100">
									<strong>✓ Unlimited storage</strong> - Files use your Dropbox quota
								</p>
								<p className="text-xs text-blue-700 dark:text-blue-300">
									No platform limits apply
								</p>
							</div>
						) : (
							<div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 p-3 space-y-1">
								<p className="text-xs text-blue-900 dark:text-blue-100">
									<strong>✓ Unlimited storage</strong> - Files use your Google Drive quota
								</p>
								<p className="text-xs text-blue-700 dark:text-blue-300">
									No platform limits apply
								</p>
							</div>
						)}
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
							Supports: Audio, DAW projects, MIDI/SysEx, presets, archives, docs, images, video
						</p>
						<input id="file-input" type="file" multiple accept=".wav,.aiff,.flac,.mp3,.aac,.ogg,.m4a,.opus,.mid,.midi,.syx,.als,.flp,.logicx,.band,.cpr,.ptx,.rpp,.song,.bwproject,.reason,.zip,.rar,.7z,.tar,.gz,.nki,.adg,.fst,.fxp,.fxb,.nmsv,.h2p,.txt,.md,.doc,.docx,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.mov,.mkv,.json,.xml" className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); onDrop(files) }} />
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
