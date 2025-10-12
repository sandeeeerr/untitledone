'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateProjectInvitation } from '@/lib/api/queries'
import { ShareLinksManager } from '@/components/organisms/share-links-manager'
import { useQuery } from '@tanstack/react-query'
import { ShareLink } from '@/components/organisms/share-links-manager'

export type InviteDialogProps = {
	projectId: string
	trigger?: React.ReactNode
}

export default function InviteDialog({ projectId, trigger }: InviteDialogProps) {
	const [open, setOpen] = useState(false)
	const [email, setEmail] = useState('')
	const [role, setRole] = useState('collaborator')
	const [activeTab, setActiveTab] = useState('email')
	const createInvite = useCreateProjectInvitation(projectId)

	// Fetch share links
	const { data: shareLinks = [], isLoading: isLoadingLinks, refetch: refetchLinks } = useQuery<ShareLink[]>({
		queryKey: ["share-links", projectId],
		queryFn: async () => {
			const response = await fetch(`/api/projects/${projectId}/share-links`);
			if (!response.ok) {
				throw new Error("Failed to fetch share links");
			}
			return response.json();
		},
		enabled: open && activeTab === 'link',
	});

	async function onSend() {
		if (!email) return
		try {
			await createInvite.mutateAsync({ email, role })
			setOpen(false)
			setEmail('')
		} catch {}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? <Button size="sm">Invite</Button>}
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl w-[calc(100%-1.5rem)]">
				<DialogHeader>
					<DialogTitle>Invite to project</DialogTitle>
					<DialogDescription>Invite collaborators via email or generate a temporary share link</DialogDescription>
				</DialogHeader>
				
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="email">Email Invitation</TabsTrigger>
						<TabsTrigger value="link">Share Link</TabsTrigger>
					</TabsList>
					
					<TabsContent value="email" className="space-y-4 mt-4">
						<div className="space-y-2">
							<Label htmlFor="invite-email">Email</Label>
							<Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
						</div>
						<div className="space-y-2">
							<Label>Role</Label>
							<Select value={role} onValueChange={setRole}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="collaborator">Collaborator</SelectItem>
									<SelectItem value="viewer">Viewer</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
							<Button onClick={onSend} disabled={createInvite.isPending || !email}>Send invite</Button>
						</DialogFooter>
					</TabsContent>
					
					<TabsContent value="link" className="mt-4">
						<ShareLinksManager
							projectId={projectId}
							initialLinks={shareLinks}
							isLoading={isLoadingLinks}
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}


