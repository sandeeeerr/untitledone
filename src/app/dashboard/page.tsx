'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const t = useTranslations('dashboard');

  return (
    <LayoutSidebar title={t('title')}>
      <div className="space-y-6">
        {/* Hero */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Sparkles className="h-5 w-5 mr-1" />
                  <span className="truncate">{t('welcomeBack')} <br /> {currentUser?.email ? currentUser.email : ''}</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {t('developmentMessage')}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">{t('alpha')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Rocket className="h-4 w-4" />
                {t('quickStart')}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {t('quickStartDescription')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/projects/new">{t('createProject')}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">{t('viewProjects')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <BookOpen className="h-4 w-4" />
                {t('whatToExpect')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('expectationDescription')}
              </p>
              <Separator className="my-3" />
              <ul className="text-sm list-disc pl-5 text-muted-foreground space-y-1">
                <li>{t('features.inviteTeammates')}</li>
                <li>{t('features.manageProjects')}</li>
                <li>{t('features.moreFeatures')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {userLoading && <Skeleton className="h-8 w-64" />}
      </div>
    </LayoutSidebar>
  );
}