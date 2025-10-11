'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StorageProviderCard from '@/components/molecules/storage-provider-card'
import DisconnectDialog from '@/components/molecules/disconnect-dialog'
import { useStorageConnections, useConnectStorageProvider, useDisconnectStorageProvider, useMyStorageUsage } from '@/lib/api/queries'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function StoragePage() {
  const searchParams = useSearchParams()
  const [connectingProvider, setConnectingProvider] = useState<'dropbox' | 'google_drive' | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
  const [providerToDisconnect, setProviderToDisconnect] = useState<'dropbox' | 'google_drive' | null>(null)

  // Fetch data
  const { data: connections, isLoading: loadingConnections } = useStorageConnections()
  const { data: storageUsage, isLoading: loadingUsage } = useMyStorageUsage()
  
  // Mutations
  const connectMutation = useConnectStorageProvider()
  const disconnectMutation = useDisconnectStorageProvider()

  // Find specific connections
  const dropboxConnection = connections?.find(c => c.provider === 'dropbox') || null
  const driveConnection = connections?.find(c => c.provider === 'google_drive') || null

  // Show success message if redirected from OAuth
  useEffect(() => {
    const connectedProvider = searchParams.get('connected')
    if (connectedProvider) {
      const providerName = connectedProvider === 'dropbox' ? 'Dropbox' : 'Google Drive'
      toast({
        title: 'Connected Successfully',
        description: `Your ${providerName} account has been connected.`,
      })
      // Clean up URL
      window.history.replaceState({}, '', '/settings/storage')
    }
  }, [searchParams])

  // Handlers
  const handleConnect = async (provider: 'dropbox' | 'google_drive') => {
    setConnectingProvider(provider)
    try {
      // This will redirect to OAuth flow, so we won't return here
      await connectMutation.mutateAsync(provider)
    } catch (error) {
      // Error handled by mutation hook (toast)
      console.error('Connection failed:', error)
      setConnectingProvider(null)
    }
  }

  const handleDisconnectClick = (provider: 'dropbox' | 'google_drive') => {
    setProviderToDisconnect(provider)
    setDisconnectDialogOpen(true)
  }

  const handleDisconnectConfirm = () => {
    if (providerToDisconnect) {
      disconnectMutation.mutate(providerToDisconnect)
      setProviderToDisconnect(null)
    }
  }

  if (loadingConnections) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h3 className="text-lg font-medium">Storage</h3>
        <p className="text-sm text-muted-foreground">
          Manage your storage connections and monitor usage
        </p>
      </div>
      <Separator />

        {/* Local Storage Usage Section - Show First */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Local Storage</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your current platform storage usage
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Storage</CardTitle>
              <CardDescription>
                Files uploaded to local storage count against your quota
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading usage...
                </div>
              ) : storageUsage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">
                      {storageUsage.mbUsed.toFixed(1)} MB / {storageUsage.mbMax} MB
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${Math.min(100, storageUsage.percentUsed)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {storageUsage.mbRemaining.toFixed(1)} MB remaining ({storageUsage.percentUsed.toFixed(1)}% used)
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load storage usage</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* External Storage Providers Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">External Storage</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect external storage to upload files without using your platform quota
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StorageProviderCard
              provider="dropbox"
              connection={dropboxConnection}
              onConnect={() => handleConnect('dropbox')}
              onDisconnect={() => handleDisconnectClick('dropbox')}
              isConnecting={connectingProvider === 'dropbox'}
            />
            <StorageProviderCard
              provider="google_drive"
              connection={driveConnection}
              onConnect={() => handleConnect('google_drive')}
              onDisconnect={() => handleDisconnectClick('google_drive')}
              isConnecting={connectingProvider === 'google_drive'}
            />
          </div>

          {/* Info about external storage */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Files uploaded to Dropbox or Google Drive don&apos;t count against your local storage quota.
            </p>
          </div>
        </div>

      {/* Disconnect confirmation dialog */}
      {providerToDisconnect && (
        <DisconnectDialog
          open={disconnectDialogOpen}
          onOpenChange={setDisconnectDialogOpen}
          provider={providerToDisconnect}
          onConfirm={handleDisconnectConfirm}
          // TODO: Query and pass affected file/project counts
        />
      )}
    </div>
  )
}

