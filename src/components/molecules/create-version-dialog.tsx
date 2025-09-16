'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Copy, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCreateProjectVersion, useProjectVersions } from '@/lib/api/queries'


export type CreateVersionDialogProps = {
	projectId: string
	trigger?: React.ReactNode
	onVersionCreated?: () => void
}

export default function CreateVersionDialog({ projectId, trigger, onVersionCreated }: CreateVersionDialogProps) {
	const [open, setOpen] = useState(false)
	const [versionType, setVersionType] = useState<'semantic' | 'date' | 'custom'>('semantic')
	const [customVersionName, setCustomVersionName] = useState('')
	const [description, setDescription] = useState('')
	const [startOption, setStartOption] = useState<'fresh' | 'copy' | 'select'>('fresh')
	const [selectedVersionId, setSelectedVersionId] = useState<string>('')
	
	const { toast } = useToast()
	const t = useTranslations('versions')
	const createVersion = useCreateProjectVersion(projectId)
	const { data: existingVersions } = useProjectVersions(projectId)
	const hasExistingVersions = (existingVersions?.length ?? 0) > 0

	const handleCreate = async () => {
		if (!description.trim()) {
			toast({
				variant: "destructive",
				title: t('missingDescription'),
				description: t('provideDescription'),
			})
			return
		}

		if (versionType === 'custom' && !customVersionName.trim()) {
			toast({
				variant: "destructive",
				title: t('missingVersionName'),
				description: t('provideCustomVersionName'),
			})
			return
		}

		try {
			const payload = {
				version_type: versionType,
				version_name: versionType === 'custom' ? customVersionName.trim() : undefined,
				description: description.trim(),
				copy_files_from_version_id: startOption === 'copy' && selectedVersionId ? selectedVersionId : undefined,
			}

			await createVersion.mutateAsync(payload)
			
			setOpen(false)
			setDescription('')
			setCustomVersionName('')
			setSelectedVersionId('')
			
			// Notify parent component that version was created
			onVersionCreated?.()
		} catch {
			// Error handling is done in the mutation
		}
	}

	const getVersionTypeDescription = (type: string) => {
		switch (type) {
			case 'semantic':
				return 'Automatically generates v1.0, v1.1, v2.0, etc.'
			case 'date':
				return 'Uses today\'s date (21/08/2024)'
			case 'custom':
				return 'You choose the version name'
			default:
				return ''
		}
	}

	const getNextVersionName = () => {
		if (versionType === 'semantic' && existingVersions) {
			const semanticVersions = existingVersions
				.filter(v => v.version_type === 'semantic')
				.map(v => v.version_name)
				.filter(name => /^v\d+\.\d+$/.test(name))
				.sort()
			
			if (semanticVersions.length === 0) return 'v1.0'
			
			const lastVersion = semanticVersions[semanticVersions.length - 1]
			const match = lastVersion.match(/^v(\d+)\.\d+$/)
			if (match) {
				const major = parseInt(match[1]) + 1
				return `v${major}.0`
			}
			return 'v1.0'
		}
		
		if (versionType === 'date') {
			const today = new Date()
			const day = String(today.getDate()).padStart(2, '0')
			const month = String(today.getMonth() + 1).padStart(2, '0')
			const year = today.getFullYear()
			return `${day}/${month}/${year}`
		}
		
		return customVersionName || 'Enter custom name'
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					<Button size="sm" variant="outline" className="gap-2">
						<Plus className="h-4 w-4" />
						New Version
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg w-[calc(100%-1.5rem)]">
				<DialogHeader>
					<DialogTitle>Create New Version</DialogTitle>
					<DialogDescription>
						Create a new version of this project with your preferred naming convention.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Version Type Selection */}
					<div className="space-y-2">
						<Label>Version Type</Label>
						<Select value={versionType} onValueChange={(value: 'semantic' | 'date' | 'custom') => setVersionType(value)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="semantic">Semantic (v1.0, v2.0)</SelectItem>
								<SelectItem value="date">Date-based (21/08/2024)</SelectItem>
								<SelectItem value="custom">Custom name</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{getVersionTypeDescription(versionType)}
						</p>
					</div>

					{/* Custom Version Name (only for custom type) */}
					{versionType === 'custom' && (
						<div className="space-y-2">
							<Label htmlFor="custom-version-name">Version Name</Label>
							<Input
								id="custom-version-name"
								placeholder="e.g., Beta Release, Final Mix"
								value={customVersionName}
								onChange={(e) => setCustomVersionName(e.target.value)}
							/>
						</div>
					)}

					{/* Preview of what the version name will be */}
					<div className="space-y-2">
						<Label>Version Name Preview</Label>
						<div className="p-3 bg-muted rounded-md">
							<span className="font-mono text-sm">{getNextVersionName()}</span>
						</div>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="version-description">Description</Label>
						<Textarea
							id="version-description"
							placeholder="Describe what this version contains or represents..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
						/>
					</div>

					{/* Start Options (only show when there is at least one existing version) */}
					{hasExistingVersions && (
						<div className="space-y-2">
							<Label>Start with</Label>
							<RadioGroup value={startOption} onValueChange={(value: 'fresh' | 'copy' | 'select') => setStartOption(value)}>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="fresh" id="start-fresh" />
									<Label htmlFor="start-fresh" className="flex items-center gap-2">
										<Upload className="h-4 w-4" />
										Start fresh (upload new files)
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="copy" id="start-copy" />
									<Label htmlFor="start-copy" className="flex items-center gap-2">
										<Copy className="h-4 w-4" />
										Copy files from previous version
									</Label>
								</div>
							</RadioGroup>
						</div>
					)}

					{/* Version Selection for copying */}
					{startOption === 'copy' && existingVersions && existingVersions.length > 0 && (
						<div className="space-y-2">
							<Label>Copy from version</Label>
							<Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
															<SelectTrigger>
								<SelectValue placeholder={t('selectVersionToCopy')} />
							</SelectTrigger>
								<SelectContent>
									{existingVersions.map((version) => (
										<SelectItem key={version.id} value={version.id}>
											{version.version_name} - {version.description}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={createVersion.isPending}>
						Cancel
					</Button>
					<Button 
						onClick={handleCreate} 
						disabled={createVersion.isPending || !description.trim() || (versionType === 'custom' && !customVersionName.trim())}
						className="gap-2"
					>
						{createVersion.isPending ? (
							<>
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Creating...
							</>
						) : (
							<>
								<Plus className="h-4 w-4" />
								Create Version
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
