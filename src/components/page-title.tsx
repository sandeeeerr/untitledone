'use client';

import { usePageTitle } from '@/hooks/use-page-title';
import type { ReactNode } from 'react';

export function PageTitle({ title, actions }: { title?: ReactNode; actions?: ReactNode } = {}) {
  const hookTitle = usePageTitle();
  const resolvedTitle = typeof title !== 'undefined' ? title : hookTitle;
  
  if (!resolvedTitle && !actions) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-between mt-4 mb-2">
      {resolvedTitle ? (
        <h1 className="text-2xl md:text-3xl font-semibold">
          {resolvedTitle}
        </h1>
      ) : <div />}
      {actions ? (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
} 