"use client"

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileAudio, Download, User } from 'lucide-react'

export type FileDrawerProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	file?: {
		id: string
		filename: string
		description: string | null
		fileSizeLabel: string
		dateLabel: string
		uploadedByName?: string
		versionName?: string | null
	}
	onDownload?: () => void
}

export default function FileDrawer({ open, onOpenChange, file, onDownload }: FileDrawerProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<FileAudio className="h-5 w-5" />
						{file?.filename || 'File details'}
					</SheetTitle>
					<SheetDescription>
						{file?.description || 'No description'}
					</SheetDescription>
				</SheetHeader>

				<div className="mt-4 space-y-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>{file?.fileSizeLabel}</span>
						<span>•</span>
						<span>{file?.dateLabel}</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<User className="h-4 w-4" />
						<span>{file?.uploadedByName || 'Unknown'}</span>
						{file?.versionName && (
							<Badge variant="secondary" className="ml-2 text-xs">{file.versionName}</Badge>
						)}
					</div>
					<div className="pt-2">
						<Button className="gap-2" onClick={onDownload}>
							<Download className="h-4 w-4" />
							Download
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	)
}
