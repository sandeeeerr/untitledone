'use client';

import * as React from 'react';
import { Home, Slash } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

export function DynamicBreadcrumbs() {
  const breadcrumbs = useBreadcrumbs();
  
  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <BreadcrumbSeparator></BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage>
                  {/* Show icon + text for dashboard, text for others */}
                  {item.href === '/dashboard' ? (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    item.label
                  )}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {/* Show icon + text for dashboard, text for others */}
                  {item.href === '/dashboard' ? (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    item.label
                  )}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 