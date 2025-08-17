'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import LayoutSidebar from '@/components/layout-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createProject } from '@/lib/api/projects'
import { useToast } from '@/hooks/use-toast'

// Form input schema (matches UI field types)
const formInputSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).trim(),
	description: z.string().max(2000).trim(),
	tags: z.string().trim(),
	genre: z.string().trim(),
	is_private: z.boolean(),
	downloads_enabled: z.boolean(),
	daw_name: z.string().trim(),
	daw_version: z.string().trim(),
	plugins: z.string().trim(),
})

// Submit schema (transforms to API payload types)
const submitSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).trim(),
	description: z.string().max(2000).trim().transform(v => v || undefined),
	tags: z.string().trim().transform(v => v ? v.split(',').map(tag => tag.trim()).filter(Boolean) : undefined),
	genre: z.string().trim().transform(v => v || undefined),
	is_private: z.boolean().default(false),
	downloads_enabled: z.boolean().default(true),
	daw_name: z.string().trim().transform(v => v || undefined),
	daw_version: z.string().trim().transform(v => v || undefined),
	plugins: z.string().trim().transform(v => {
		if (!v) return undefined
		return v.split(',').map(item => {
			const trimmed = item.trim()
			// Support formats: "Name@1.2", "Name:1.2", "Name v1.2", or just "Name"
			const atParts = trimmed.split('@')
			if (atParts.length === 2) {
				return { name: atParts[0].trim(), version: atParts[1].trim() }
			}
			const colonParts = trimmed.split(':')
			if (colonParts.length === 2) {
				return { name: colonParts[0].trim(), version: colonParts[1].trim() }
			}
			const vMatch = trimmed.match(/^(.*)\s+v(\S+)$/i)
			if (vMatch) {
				return { name: vMatch[1].trim(), version: vMatch[2].trim() }
			}
			return { name: trimmed }
		})
	}),
})

type FormValues = z.infer<typeof formInputSchema>

export default function NewProjectPage() {
	const router = useRouter()
	const { toast } = useToast()
	const t = useTranslations('projects.new')

	const form = useForm<FormValues>({
		resolver: zodResolver(formInputSchema),
		defaultValues: {
			name: '',
			description: '',
			tags: '',
			genre: '',
			is_private: false,
			downloads_enabled: true,
			daw_name: '',
			daw_version: '',
			plugins: '',
		},
	})

	const { isSubmitting } = form.formState

	async function onSubmit(values: FormValues) {
		try {
			const parsed = submitSchema.parse(values)
			const created = await createProject({
				name: parsed.name,
				description: parsed.description,
				tags: parsed.tags,
				genre: parsed.genre,
				is_private: parsed.is_private,
				downloads_enabled: parsed.downloads_enabled,
				daw_name: parsed.daw_name,
				daw_version: parsed.daw_version,
				plugins: parsed.plugins,
			})
			toast({ title: t('success.title'), description: t('success.description', { name: created.name }) })
			router.replace(`/projects/${created.id}`)
		} catch (err: unknown) {
			// Parse backend errors and map to form fields
			const message = err instanceof Error ? err.message : ''
			
			// Try to map common field errors
			if (message.includes('name')) {
				form.setError('name', { message: 'Name is required' })
			}
			if (message.includes('description')) {
				form.setError('description', { message: 'Invalid description' })
			}
			if (message.includes('tags')) {
				form.setError('tags', { message: 'Invalid tags format' })
			}
			if (message.includes('genre')) {
				form.setError('genre', { message: 'Invalid genre' })
			}
			if (message.includes('daw')) {
				form.setError('daw_name', { message: 'Invalid DAW name' })
			}
			if (message.includes('plugins')) {
				form.setError('plugins', { message: 'Invalid plugins format' })
			}
			
			toast({ 
				variant: 'destructive', 
				title: t('error.title'), 
				description: message || t('error.description') 
			})
		}
	}

	return (
		<LayoutSidebar title={t('title')}>
			<div>
				<Card>
					<CardContent className="pt-6">
						<Form {...form}>
							<form 
								onSubmit={form.handleSubmit(onSubmit)} 
								className="space-y-6"
								aria-busy={isSubmitting}
							>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('fields.name.label')}</FormLabel>
											<FormControl>
												<Input 
													placeholder={t('fields.name.placeholder')} 
													{...field} 
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('fields.description.label')}</FormLabel>
											<FormControl>
												<Textarea 
													placeholder={t('fields.description.placeholder')} 
													rows={4} 
													{...field} 
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormDescription>{t('fields.description.help')}</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="tags"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('fields.tags.label')}</FormLabel>
												<FormControl>
													<Input 
														placeholder={t('fields.tags.placeholder')} 
														{...field} 
														disabled={isSubmitting}
													/>
												</FormControl>
												<FormDescription>{t('fields.tags.help')}</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="genre"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('fields.genre.label')}</FormLabel>
												<FormControl>
													<Input 
														placeholder={t('fields.genre.placeholder')} 
														{...field} 
														disabled={isSubmitting}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="daw_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('fields.daw_name.label')}</FormLabel>
												<FormControl>
													<Input 
														placeholder={t('fields.daw_name.placeholder')} 
														{...field} 
														disabled={isSubmitting}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="daw_version"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('fields.daw_version.label')}</FormLabel>
												<FormControl>
													<Input 
														placeholder={t('fields.daw_version.placeholder')} 
														{...field} 
														disabled={isSubmitting}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="plugins"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('fields.plugins.label')}</FormLabel>
											<FormControl>
												<Input 
													placeholder={t('fields.plugins.placeholder')} 
													{...field} 
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormDescription>{t('fields.plugins.help')}</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="is_private"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
												<FormControl>
													<Checkbox 
														checked={Boolean(field.value)} 
														onCheckedChange={(v: boolean | 'indeterminate') => field.onChange(Boolean(v))}
														disabled={isSubmitting}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>{t('fields.is_private.label')}</FormLabel>
													<FormDescription>{t('fields.is_private.help')}</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="downloads_enabled"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
												<FormControl>
													<Checkbox 
														checked={Boolean(field.value)} 
														onCheckedChange={(v: boolean | 'indeterminate') => field.onChange(Boolean(v))}
														disabled={isSubmitting}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>{t('fields.downloads_enabled.label')}</FormLabel>
													<FormDescription>{t('fields.downloads_enabled.help')}</FormDescription>
												</div>
											</FormItem>
										)}
									/>
								</div>

								<div className="flex justify-end gap-2">
									<Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
										{t('actions.cancel')}
									</Button>
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? t('actions.creating') : t('actions.create')}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</LayoutSidebar>
	)
} 