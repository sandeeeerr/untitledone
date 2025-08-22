"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LoadingStateProps = {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingState({ 
  message = "Loading...", 
  className,
  size = 'md' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div 
      className={cn("flex items-center justify-center py-12", className)}
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      <span className="ml-2">{message}</span>
    </div>
  )
}
