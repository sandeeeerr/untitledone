'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateProjectInvitation } from '@/lib/api/queries'

export type InviteDialogProps = {
	projectId: string
	trigger?: React.ReactNode
}

export default function InviteDialog({ projectId, trigger }: InviteDialogProps) {
	const [open, setOpen] = useState(false)
	const [email, setEmail] = useState('')
	const [role, setRole] = useState('collaborator')
	const createInvite = useCreateProjectInvitation(projectId)

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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite collaborator</DialogTitle>
					<DialogDescription>Send an invitation to collaborate on this project.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
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
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={onSend} disabled={createInvite.isPending || !email}>Send invite</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}


