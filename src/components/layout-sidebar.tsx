'use client';

import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/use-current-user';
import MainSidebar from './main-sidebar';
import AppHeader from '@/components/app-header';
import { DynamicBreadcrumbs } from './dynamic-breadcrumbs';
import { PageTitle } from './page-title';
import { BreadcrumbProvider } from './breadcrumb-context';

export default function LayoutSidebar({
  children,
  className,
  containerClassName,
  contentClassName,
  isOpen,
  title,
  titleActions,
  breadcrumbLabelOverride,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  isOpen?: boolean;
  title?: React.ReactNode;
  titleActions?: React.ReactNode;
  breadcrumbLabelOverride?: string;
}) {
  const currentUser = useCurrentUser();
  const sidebarOpen = isOpen ?? (currentUser.data?.id || currentUser.isLoading ? undefined : false);

  return (
    <>
      <SidebarProvider open={sidebarOpen}>
        <MainSidebar />

        <main className={cn('flex-1 flex flex-col min-h-svh bg-background', containerClassName)}>
          {/* Sticky header that aligns with content container */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
              <AppHeader fullWidth={true} matchSidebarWidth={false} showSidebarTriggerOnMobile={true} />
            </div>
          </header>

          <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8 py-6">
            <div className="pb-6">
              <PageTitle title={title} actions={titleActions} />
              <div className="mt-4">
                <BreadcrumbProvider value={{ currentPageLabel: breadcrumbLabelOverride }}>
                  <DynamicBreadcrumbs />
                </BreadcrumbProvider>
              </div>
            </div>

            <div className={cn('flex-1', className)}>
              <div className={cn('flex-1', contentClassName)}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </>
  );
}
