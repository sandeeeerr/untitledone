"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/atoms/empty-state'
import { MessageSquare } from 'lucide-react'

export default function ProjectComments() {
	const t = useTranslations('comments')
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Comments</CardTitle>
			</CardHeader>
			<CardContent className="p-4 md:p-6">
				<EmptyState 
					icon={<MessageSquare className="h-12 w-12" />} 
					title={t('contextSpecific')}
					description={t('openActivityOrFileToComment')}
				/>
			</CardContent>
		</Card>
	)
}
