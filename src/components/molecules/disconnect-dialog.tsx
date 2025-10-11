'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export type DisconnectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: 'dropbox' | 'google_drive'
  onConfirm: () => void
  affectedFilesCount?: number
  affectedProjectsCount?: number
}

export default function DisconnectDialog({
  open,
  onOpenChange,
  provider,
  onConfirm,
  affectedFilesCount,
  affectedProjectsCount,
}: DisconnectDialogProps) {
  const providerName = provider === 'dropbox' ? 'Dropbox' : 'Google Drive'

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {providerName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Files stored in {providerName} will become inaccessible until you reconnect.
              </p>
              <p>
                <strong>Project collaborators will also lose access</strong> to files you uploaded to {providerName}.
              </p>
              {(affectedFilesCount !== undefined || affectedProjectsCount !== undefined) && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {affectedFilesCount !== undefined && affectedFilesCount > 0 && (
                      <>
                        <strong>{affectedFilesCount}</strong> file{affectedFilesCount !== 1 ? 's' : ''} 
                        {affectedProjectsCount !== undefined && affectedProjectsCount > 0 && (
                          <> across <strong>{affectedProjectsCount}</strong> project{affectedProjectsCount !== 1 ? 's' : ''}</>
                        )} will be affected
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

