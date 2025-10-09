'use client';

import * as React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  href?: string;
  label: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs atom component with truncation support
 * - Shows max 3 segments: first, ellipsis, last (when more than 3)
 * - Home icon for first dashboard item
 * - ChevronRight separators
 * - Last item is semibold and non-clickable
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // Truncate if more than 3 items: show first, ellipsis, last
  const displayItems = React.useMemo(() => {
    if (items.length <= 3) {
      return items;
    }
    
    return [
      items[0],
      { label: '...', isEllipsis: true } as BreadcrumbItem & { isEllipsis?: boolean },
      items[items.length - 1],
    ];
  }, [items]);

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center gap-2 text-sm text-muted-foreground min-h-[2rem]', className)}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isEllipsis = 'isEllipsis' in item && item.isEllipsis;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            
            {isEllipsis ? (
              <span 
                className="flex items-center gap-1.5 px-1"
                aria-hidden="true"
                title="More breadcrumbs"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : isLast ? (
              <span 
                className="flex items-center gap-1.5 font-medium text-foreground"
                aria-current="page"
              >
                {item.icon}
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1"
              >
                {item.icon || (index === 0 && item.href === '/dashboard' && <Home className="h-4 w-4" />)}
                {item.label}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 px-1">
                {item.icon}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

