'use client';

import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/use-current-user';
import MainSidebar from './main-sidebar';
import AppHeader from '@/components/app-header';
import { DynamicBreadcrumbs } from './dynamic-breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PageTitle } from './page-title';
import { Separator } from './ui/separator';

export default function LayoutSidebar({
  children,
  className,
  containerClassName,
  contentClassName,
  isOpen,
  title,
  titleActions,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  isOpen?: boolean;
  title?: React.ReactNode;
  titleActions?: React.ReactNode;
}) {
  const currentUser = useCurrentUser();
  const sidebarOpen = isOpen ?? (currentUser.data?.id || currentUser.isLoading ? undefined : false);

  return (
    <>
      <AppHeader className="fixed top-0 left-0 right-0 z-40" fullWidth matchSidebarWidth />
      <SidebarProvider open={sidebarOpen}>
        <MainSidebar />

        <main className={cn('flex-1 flex flex-col overflow-auto', containerClassName)} style={{ paddingTop: '4rem' }}>

          {sidebarOpen !== false ? <SidebarTrigger className="mx-3 mt-2" /> : null}
          
          <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8 py-8">

          <div className="py-4">
            <DynamicBreadcrumbs />
          </div>
          
          <div className={cn('flex-1 bg-background', className)}>
            <div className={cn('flex-1 ', contentClassName)}>
              {children}
            </div>
          </div>
          </div>
        </main>
      </SidebarProvider>
    </>
  );
}
