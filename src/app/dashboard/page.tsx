'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import LayoutSidebar from '@/components/layout-sidebar';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const t = useTranslations('home');

  return (
    <LayoutSidebar title={t('welcome', { email: currentUser?.email || 'john.doe@example.com' })}>
      <div className="container py-8">
        <div className="flex flex-col gap-1">
          {userLoading && <Skeleton className="h-8 w-64" />}
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>
    </LayoutSidebar>
  );
} 