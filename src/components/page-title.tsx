'use client';

import { usePageTitle } from '@/hooks/use-page-title';

export function PageTitle() {
  const title = usePageTitle();
  
  if (!title) {
    return null;
  }
  
  return (
    <h1 className="text-6xl mt-4 mb-2">
      {title}
    </h1>
  );
} 