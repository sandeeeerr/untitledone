'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FaDropbox, FaGoogleDrive } from 'react-icons/fa'
import type { StorageConnection } from '@/lib/storage/types'

export type StorageProviderCardProps = {
  provider: 'dropbox' | 'google_drive'
  connection: StorageConnection | null
  onConnect: () => void
  onDisconnect: () => void
  isConnecting?: boolean
}

export default function StorageProviderCard({
  provider,
  connection,
  onConnect,
  onDisconnect,
  isConnecting = false,
}: StorageProviderCardProps) {
  const providerName = provider === 'dropbox' ? 'Dropbox' : 'Google Drive'
  const isConnected = connection !== null

  // Provider branding
  const providerColor = provider === 'dropbox' ? '#0061FF' : '#4285F4'
  const ProviderIcon = provider === 'dropbox' ? FaDropbox : FaGoogleDrive

  // Format connection date
  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return 'N/A'
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${providerColor}15` }}
          >
            <ProviderIcon className="h-5 w-5" style={{ color: providerColor }} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{providerName}</CardTitle>
            <CardDescription>
              {isConnected ? 'Connected' : 'Not connected'}
            </CardDescription>
          </div>
          {isConnected ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={onConnect}
              disabled={isConnecting}
              style={{ 
                backgroundColor: isConnecting ? undefined : providerColor,
                borderColor: isConnecting ? undefined : providerColor,
              }}
              className={isConnecting ? '' : 'hover:opacity-90'}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {isConnected && connection && (
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account</span>
            <span className="font-medium">{connection.providerAccountName || 'Unknown'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Connected</span>
            <span className="font-medium">{formatDate(connection.connectedAt)}</span>
          </div>
          {connection.status !== 'active' && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Connection issue:</strong> Your {providerName} connection needs to be refreshed.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full" 
                onClick={onConnect}
              >
                Reconnect {providerName}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

