import React from 'react'
import { Button } from '@/components/ui/button'
import { FileAudio, Download } from 'lucide-react'

export type FileCardProps = {
	filename: string
	description?: string | null
	fileSizeLabel: string
	dateLabel: string
	icon?: React.ReactNode
	onPreview?: () => void
	onDownload?: () => void
	onClick?: () => void
}

export default function FileCard({ filename, description, fileSizeLabel, dateLabel, icon, onPreview, onDownload, onClick }: FileCardProps) {
	return (
		<div
			onClick={onClick}
			className={`p-3 border rounded-lg transition-colors h-full ${onClick ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : -1}
		>
			<div className="flex items-center gap-2 mb-2">
				{icon ?? <FileAudio className="h-4 w-4 text-blue-600" />}
				<p className="font-medium text-sm truncate" title={filename}>{filename}</p>
			</div>
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span>{fileSizeLabel}</span>
				<span>•</span>
				<span>{dateLabel}</span>
			</div>
			{description && (
				<p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
			)}
			<div className="mt-3 flex items-center justify-end gap-2">
				<Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); onPreview?.() }}>
					<FileAudio className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); onDownload?.() }}>
					<Download className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}
