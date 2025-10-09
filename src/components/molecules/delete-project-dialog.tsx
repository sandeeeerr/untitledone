'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type DeleteProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  onConfirm: () => void | Promise<void>
  isDeleting?: boolean
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  isDeleting = false,
}: DeleteProjectDialogProps) {
  const t = useTranslations('projects.delete')
  const [confirmText, setConfirmText] = React.useState('')

  const isConfirmValid = confirmText === projectName

  React.useEffect(() => {
    if (!open) {
      setConfirmText('')
    }
  }, [open])

  const handleConfirm = async () => {
    if (!isConfirmValid) return
    await onConfirm()
    setConfirmText('')
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="confirm-name" className="text-sm font-medium">
            {t('confirmPlaceholder')}
          </Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            disabled={isDeleting}
            aria-invalid={!isConfirmValid && confirmText.length > 0}
          />
          {!isConfirmValid && confirmText.length > 0 && (
            <p className="text-sm text-destructive" role="alert">
              {t('confirmMismatch')}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? t('deleting') : t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

