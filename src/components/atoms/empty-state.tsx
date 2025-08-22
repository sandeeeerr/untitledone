"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  icon?: React.ReactNode
  title?: string
  description?: string
  className?: string
  children?: React.ReactNode // optional actions
}

export default function EmptyState({ icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-8", className)}>
      {icon ? <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">{icon}</div> : null}
      {title ? <p className="text-sm text-muted-foreground mb-2">{title}</p> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-4 flex items-center justify-center gap-2">{children}</div> : null}
    </div>
  )
}


