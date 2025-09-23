'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Autocomplete from '@/components/ui/autocomplete'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TagInput } from '@/components/molecules/tag-input'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const formInputSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200).trim(),
	description: z.string().max(2000).trim(),
	tags: z.array(z.string().trim()),
	genre: z.string().trim(),
	is_private: z.boolean(),
	downloads_enabled: z.boolean(),
	daw_name: z.string().trim(),
	daw_version: z.string().trim(),
	plugins: z.array(z.string().trim()),
})

export type ProjectFormValues = z.infer<typeof formInputSchema>

export type ProjectFormProps = {
	initialValues?: Partial<ProjectFormValues>
	submitLabel: string
	submittingLabel: string
	cancelLabel: string
	onSubmit: (values: ProjectFormValues) => Promise<void>
  compact?: boolean
}

export default function ProjectForm({ initialValues, submitLabel, submittingLabel, cancelLabel, onSubmit, compact }: ProjectFormProps) {
	const t = useTranslations('projects.new')
	const [showAdvanced, setShowAdvanced] = useState(false)
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
			plugins: (Array.isArray(initialValues?.plugins) ? (initialValues?.plugins as string[]) : []),
		},
	})

	const { isSubmitting } = form.formState

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" aria-busy={isSubmitting}>
				{!compact && (
					<div>
						<h3 className="text-sm font-medium text-foreground">{t('ui.basicsTitle')}</h3>
						<p className="text-xs text-muted-foreground mt-1">{t('ui.basicsHelp')}</p>
					</div>
				)}
				{/* Name */}
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('fields.name.label')}</FormLabel>
							<FormControl>
								<Input placeholder={t('fields.name.placeholder')} {...field} disabled={isSubmitting} />
							</FormControl>
							{compact && (
								<FormDescription>
									{t('fields.name.help', { default: 'Choose a clear name. You can add details later.' })}
								</FormDescription>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				{!compact && (
					<div>
						<h3 className="text-sm font-medium text-foreground">{t('ui.visibilityTitle')}</h3>
						<p className="text-xs text-muted-foreground mt-1">{t('ui.visibilityHelp')}</p>
					</div>
				)}
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

				{!compact && (
					<div>
						<h3 className="text-sm font-medium text-foreground">{t('ui.detailsTitle')}</h3>
						<p className="text-xs text-muted-foreground mt-1">{t('ui.detailsHelp')}</p>
					</div>
				)}
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('fields.description.label')}</FormLabel>
							<FormControl>
								<Textarea placeholder={t('fields.description.placeholder')} rows={4} {...field} disabled={isSubmitting} />
							</FormControl>
							<FormDescription>
								{t('fields.description.shortHelp', { default: 'Write a short description (optional).' })}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="pt-2 border-t">
					<Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced(v => !v)} aria-expanded={showAdvanced} className="gap-2">
						<ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
						{showAdvanced ? t('ui.hideAdvanced') : t('ui.showMore')}
					</Button>
				</div>
				{showAdvanced && (
					<>
					<div className="mt-4">
						<h3 className="text-sm font-medium text-foreground">{t('ui.advancedTitle')}</h3>
						<p className="text-xs text-muted-foreground mt-1">{t('ui.advancedHelp')}</p>
					</div>
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
											setTags={(next) => field.onChange(next as string[])}
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
                                        <Autocomplete
                                            placeholder={t('fields.genre.placeholder')}
                                            value={field.value}
                                            onChange={field.onChange}
                                            staticOptions={[
                                                'House','Techno','Trance','Drum & Bass','Dubstep','Hip Hop','Trap','Pop','Rock','Indie','Ambient','Lo-Fi','Jazz','Classical'
                                            ]}
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
                                        <Autocomplete
                                            placeholder={t('fields.daw_name.placeholder')}
                                            value={field.value}
                                            onChange={field.onChange}
                                            staticOptions={[
                                                'Ableton Live','FL Studio','Logic Pro','Pro Tools','Cubase','Bitwig Studio','Reason','Reaper','Studio One','GarageBand'
                                            ]}
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
                                    <TagInput
                                        placeholder={t('fields.plugins.placeholder')}
                                        tags={(field.value as string[]) ?? []}
                                        setTags={(next) => field.onChange(next as unknown as string[])}
                                    />
                                </FormControl>
                                <FormDescription>{t('fields.plugins.help')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
					</>
				)}


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


