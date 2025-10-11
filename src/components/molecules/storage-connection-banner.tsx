'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { useConnectStorageProvider } from '@/lib/api/queries'

export type StorageConnectionBannerProps = {
  provider: 'dropbox' | 'google_drive'
  status: 'active' | 'expired' | 'error'
  isOwner: boolean
  ownerName?: string
  userId?: string
}

export default function StorageConnectionBanner({
  provider,
  status,
  isOwner,
  ownerName,
  userId,
}: StorageConnectionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const connectMutation = useConnectStorageProvider()
  const providerName = provider === 'dropbox' ? 'Dropbox' : 'Google Drive'

  // Check localStorage for dismissed state
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const key = `storage_banner_dismissed_${provider}_${userId}`
      const dismissed = localStorage.getItem(key)
      setIsDismissed(dismissed === 'true')
    }
  }, [provider, userId])

  // Don't show if status is active or banner is dismissed
  if (status === 'active' || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined' && userId) {
      const key = `storage_banner_dismissed_${provider}_${userId}`
      localStorage.setItem(key, 'true')
      setIsDismissed(true)
    }
  }

  const handleReconnect = async () => {
    try {
      await connectMutation.mutateAsync(provider)
      // Clear dismissed state on successful reconnection
      if (typeof window !== 'undefined' && userId) {
        const key = `storage_banner_dismissed_${provider}_${userId}`
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Reconnection failed:', error)
    }
  }

  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <AlertTitle className="text-amber-900 dark:text-amber-100">
          {providerName} Connection Issue
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          {isOwner ? (
            <>
              Your {providerName} connection has expired. Reconnect to restore access for you and your collaborators.
            </>
          ) : (
            <span>
              Files from {ownerName || 'the file owner'}
              {`'s ${providerName} are temporarily unavailable. They need to reconnect their account.`}
            </span>
          )}
        </AlertDescription>
        <div className="mt-3 flex items-center gap-2">
          {isOwner && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleReconnect}
              disabled={connectMutation.isPending}
              className="border-amber-600 text-amber-900 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-100 dark:hover:bg-amber-900"
            >
              {connectMutation.isPending ? 'Reconnecting...' : `Reconnect ${providerName}`}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
          >
            <X className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
        </div>
      </div>
    </Alert>
  )
}

