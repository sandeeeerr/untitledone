import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'

export type VersionAccordionProps = {
	versionLabel: string
	fileCount: number
	isOpen: boolean
	isActive?: boolean
	onToggle: () => void
	children: React.ReactNode
}

export default function VersionAccordion({ versionLabel, fileCount, isOpen, isActive = false, onToggle, children }: VersionAccordionProps) {
	return (
		<Card className={`${isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-200'} transition-colors`}>
			<CardHeader className={`py-3 px-6 ${isOpen ? 'pb-3 sm:!pb-0' : ''}`}>
				<button type="button" onClick={onToggle} className="w-full flex items-center justify-between text-left group">
					<div className="flex items-center gap-3 min-w-0">
						<CardTitle className="text-base font-semibold truncate">{versionLabel}</CardTitle>
						<Badge variant="secondary" className="text-xs">{fileCount} file{fileCount !== 1 ? 's' : ''}</Badge>
					</div>
					<ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
				</button>
			</CardHeader>
			{isOpen && (
				<CardContent className="pt-0 pb-4">
					{children}
				</CardContent>
			)}
		</Card>
	)
}
