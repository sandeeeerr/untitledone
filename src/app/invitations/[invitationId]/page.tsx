'use client'

import { use, useEffect, useState } from 'react'
import LayoutSidebar from '@/components/organisms/layout-sidebar'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAcceptInvitation } from '@/lib/api/queries'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function AcceptInvitationPage({ params, searchParams }: { params: Promise<{ invitationId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { invitationId } = use(params)
    const sp = use(searchParams)
    const token = typeof sp?.token === 'string' ? sp.token : ''
    const router = useRouter()
    const { data: currentUser } = useCurrentUser()
    const [ready, setReady] = useState(false)
    const mutation = useAcceptInvitation(invitationId, token)

    useEffect(() => {
        setReady(true)
    }, [])

    useEffect(() => {
        if (!ready) return
        if (!token) return
        if (mutation.isPending || mutation.isSuccess) return
        if (!currentUser) {
            const next = encodeURIComponent(`/invitations/${invitationId}?token=${token}`)
            router.replace(`/auth/login?next=${next}`)
            return
        }
        mutation.mutate(undefined, {
            onSuccess: (res) => {
                const projectId = (res as { project_id?: string })?.project_id
                if (projectId) router.replace(`/projects/${projectId}`)
                else router.replace('/projects')
            },
        })
    }, [ready, token, currentUser, mutation.isPending, mutation.isSuccess, mutation, router, invitationId])

    if (!token) {
        return (
            <LayoutSidebar title="Invitation">
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Invalid invitation link</p>
                </div>
            </LayoutSidebar>
        )
    }

    return (
        <LayoutSidebar title="Invitation">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                {(!currentUser || mutation.isPending) && (
                    <div className="flex items-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Processing invitation...</span>
                    </div>
                )}
                {mutation.isError && (
                    <div className="text-center text-sm text-red-500">
                        {(mutation.error as { message?: string })?.message || 'Failed to accept invitation'}
                    </div>
                )}
                {!!currentUser && !mutation.isPending && (
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Accept Invitation</Button>
                )}
            </div>
        </LayoutSidebar>
    )
}


