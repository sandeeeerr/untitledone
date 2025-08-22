'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export type EditVersionDialogProps = {
	versionId: string
	currentName: string
	currentDescription: string
}

export default function EditVersionDialog({ currentName, currentDescription }: EditVersionDialogProps) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState(currentName)
	const [description, setDescription] = useState(currentDescription)
	const [isSubmitting, setIsSubmitting] = useState(false)
	
	const { toast } = useToast()

	const handleSave = async () => {
		if (!name.trim()) {
			toast({
				variant: "destructive",
				title: "Missing name",
				description: "Please provide a version name.",
			})
			return
		}

		if (!description.trim()) {
			toast({
				variant: "destructive",
				title: "Missing description",
				description: "Please provide a description for the version.",
			})
			return
		}

		try {
			setIsSubmitting(true)
			
			// TODO: Implement API call to update version
			// await updateProjectVersion(versionId, { name: name.trim(), description: description.trim() })
			
			toast({
				title: "Version updated",
				description: "Version has been updated successfully.",
			})
			
			setOpen(false)
		} catch {
			toast({
				variant: "destructive",
				title: "Update failed",
				description: "Failed to update version. Please try again.",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleCancel = () => {
		setName(currentName)
		setDescription(currentDescription)
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<Edit className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg w-[calc(100%-1.5rem)]">
				<DialogHeader>
					<DialogTitle>Edit Version</DialogTitle>
					<DialogDescription>
						Update the name and description for this version.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="version-name">Version Name</Label>
						<Input
							id="version-name"
							placeholder="e.g., v1.0, Beta Release"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="version-description">Description</Label>
						<Textarea
							id="version-description"
							placeholder="Describe what this version contains or represents..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							disabled={isSubmitting}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button 
						onClick={handleSave} 
						disabled={isSubmitting || !name.trim() || !description.trim()}
						className="gap-2"
					>
						{isSubmitting ? (
							<>
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Saving...
							</>
						) : (
							'Save Changes'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
