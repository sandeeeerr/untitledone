"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import EmptyState from '@/components/atoms/empty-state'

export default function ProjectComments() {
	// TODO: Implement comments loading logic here
	const isLoading = false
	const error = null
	const comments: unknown[] = [] // TODO: Replace with actual comments data
	const t = useTranslations('comments')

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Comments</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
						<span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Comments</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-red-600">Failed to load comments. Please try again.</p>
				</CardContent>
			</Card>
		)
	}

	if (!comments || comments.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Comments</CardTitle>
				</CardHeader>
				<CardContent className="p-4 md:p-6">
					<EmptyState 
						icon={<MessageSquare className="h-12 w-12" />} 
						title={t('noCommentsYet')} 
						description={t('startConversation')} 
					/>
				</CardContent>
			</Card>
		)
	}

	// TODO: Implement comments rendering logic
	return (
		<div className="space-y-4">
			{/* Comments will be rendered here */}
		</div>
	)
}
