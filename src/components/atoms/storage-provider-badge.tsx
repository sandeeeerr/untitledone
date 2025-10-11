import { HardDrive } from 'lucide-react'
import { FaDropbox, FaGoogleDrive } from 'react-icons/fa'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type StorageProviderBadgeProps = {
  provider: 'local' | 'dropbox' | 'google_drive'
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export default function StorageProviderBadge({
  provider,
  size = 'sm',
  showLabel = false,
  className,
}: StorageProviderBadgeProps) {
  // Provider metadata
  const providerInfo = {
    local: {
      name: 'Local Storage',
      icon: HardDrive,
      color: '#64748b', // slate-500
    },
    dropbox: {
      name: 'Dropbox',
      icon: FaDropbox,
      color: '#0061FF', // Official Dropbox blue
    },
    google_drive: {
      name: 'Google Drive',
      icon: FaGoogleDrive,
      color: '#4285F4', // Official Google blue
    },
  }

  const info = providerInfo[provider]
  const Icon = info.icon
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  const badge = (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Icon 
        className={iconSize} 
        style={{ color: info.color }}
      />
      {showLabel && (
        <span className="text-xs font-medium" style={{ color: info.color }}>
          {info.name}
        </span>
      )}
    </div>
  )

  // Wrap in tooltip if no label is shown
  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Stored in {info.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

