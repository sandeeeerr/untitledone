'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TagInput } from '@/components/tag-input'

const formInputSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).trim(),
	description: z.string().max(2000).trim(),
	tags: z.array(z.string().trim()),
	genre: z.string().trim(),
	is_private: z.boolean(),
	downloads_enabled: z.boolean(),
	daw_name: z.string().trim(),
	daw_version: z.string().trim(),
	plugins: z.string().trim(),
})

export type ProjectFormValues = z.infer<typeof formInputSchema>

export type ProjectFormProps = {
	initialValues?: Partial<ProjectFormValues>
	submitLabel: string
	submittingLabel: string
	cancelLabel: string
	onSubmit: (values: ProjectFormValues) => Promise<void>
}

export default function ProjectForm({ initialValues, submitLabel, submittingLabel, cancelLabel, onSubmit }: ProjectFormProps) {
	const t = useTranslations('projects.new')
	const form = useForm<ProjectFormValues>({
		resolver: zodResolver(formInputSchema),
		defaultValues: {
			name: initialValues?.name ?? '',
			description: initialValues?.description ?? '',
			tags: initialValues?.tags ?? [],
			genre: initialValues?.genre ?? '',
			is_private: Boolean(initialValues?.is_private ?? false),
			downloads_enabled: Boolean(initialValues?.downloads_enabled ?? true),
			daw_name: initialValues?.daw_name ?? '',
			daw_version: initialValues?.daw_version ?? '',
			plugins: initialValues?.plugins ?? '',
		},
	})

	const { isSubmitting } = form.formState

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" aria-busy={isSubmitting}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('fields.name.label')}</FormLabel>
							<FormControl>
								<Input placeholder={t('fields.name.placeholder')} {...field} disabled={isSubmitting} />
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
								<Textarea placeholder={t('fields.description.placeholder')} rows={4} {...field} disabled={isSubmitting} />
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
									<TagInput
										placeholder={t('fields.tags.placeholder')}
										tags={(field.value as unknown as string[]) ?? []}
										setTags={(next) => field.onChange(next as any)}
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
									<Input placeholder={t('fields.genre.placeholder')} {...field} disabled={isSubmitting} />
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
									<Input placeholder={t('fields.daw_name.placeholder')} {...field} disabled={isSubmitting} />
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
									<Input placeholder={t('fields.daw_version.placeholder')} {...field} disabled={isSubmitting} />
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
								<Input placeholder={t('fields.plugins.placeholder')} {...field} disabled={isSubmitting} />
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
									<Checkbox checked={Boolean(field.value)} onCheckedChange={(v: boolean | 'indeterminate') => field.onChange(Boolean(v))} disabled={isSubmitting} />
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
									<Checkbox checked={Boolean(field.value)} onCheckedChange={(v: boolean | 'indeterminate') => field.onChange(Boolean(v))} disabled={isSubmitting} />
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
					<Button type="button" variant="outline" onClick={() => history.back()} disabled={isSubmitting}>
						{cancelLabel}
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? submittingLabel : submitLabel}
					</Button>
				</div>
			</form>
		</Form>
	)
}


