'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTranslations } from 'next-intl'
import LayoutSidebar from '@/components/layout-sidebar'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useProfile, useUpdateProfile } from '@/lib/api/queries'

const ProfileSchema = z.object({
  display_name: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  website: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  location: z.string().max(120).optional(),
  instagram: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  twitter: z.string().url().optional().or(z.literal('').transform(() => undefined)),
})

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const t = useTranslations('profile')

  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      display_name: '',
      bio: '',
      website: '',
      location: '',
      instagram: '',
      twitter: '',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name ?? '',
        bio: profile.bio ?? '',
        website: profile.website ?? '',
        location: profile.location ?? '',
        instagram: (profile.social_links as any)?.instagram ?? '',
        twitter: (profile.social_links as any)?.twitter ?? '',
      })
    }
  }, [profile, form])

  const { mutateAsync: saveProfile, isPending } = useUpdateProfile()

  async function onSubmit(values: z.infer<typeof ProfileSchema>) {
    const social_links = {
      ...(values.instagram ? { instagram: values.instagram } : {}),
      ...(values.twitter ? { twitter: values.twitter } : {}),
    }
    await saveProfile({
      display_name: values.display_name,
      bio: values.bio,
      website: values.website,
      location: values.location,
      social_links: social_links as any,
    })
  }

  const loading = userLoading || profileLoading

  return (
    <LayoutSidebar>
      <div className="container py-8">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('title', { defaultValue: 'Your profile' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-72" />
                  <Skeleton className="h-5 w-56" />
                </div>
              ) : user ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t('id', { defaultValue: 'User ID' })}</span>
                      <Badge variant="secondary" className="font-mono text-xs truncate max-w-full">
                        {user.id}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t('email', { defaultValue: 'Email' })}</div>
                      <div className="text-base">{user.email}</div>
                    </div>
                    {profile?.username && (
                      <div>
                        <div className="text-sm text-muted-foreground">{t('username', { defaultValue: 'Username' })}</div>
                        <div className="text-base font-mono">{profile.username}</div>
                      </div>
                    )}
                  </div>

                  <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">{t('displayName', { defaultValue: 'Display name' })}</label>
                        <Input {...form.register('display_name')} placeholder={t('displayNamePlaceholder', { defaultValue: 'Your display name' })} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Location</label>
                        <Input {...form.register('location')} placeholder="City, Country" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Website</label>
                        <Input {...form.register('website')} placeholder="https://example.com" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Bio</label>
                        <Input {...form.register('bio')} placeholder="Tell something about yourself" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Instagram URL</label>
                        <Input {...form.register('instagram')} placeholder="https://instagram.com/username" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Twitter/X URL</label>
                        <Input {...form.register('twitter')} placeholder="https://x.com/username" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save changes'}</Button>
                  </form>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t('noUser', { defaultValue: 'No user is currently signed in.' })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutSidebar>
  )
} 