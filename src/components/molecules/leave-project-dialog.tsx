"use client"

import React from "react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type LeaveProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  onConfirm: () => void | Promise<void>
  isLeaving?: boolean
}

export function LeaveProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  isLeaving = false,
}: LeaveProjectDialogProps) {
  const t = useTranslations('projects.actions')
  const tCommon = useTranslations('common')

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('leave')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('leaveProjectConfirm', { projectName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLeaving}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLeaving ? t('leaving') : t('leave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
