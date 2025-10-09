'use client';

import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/use-current-user';
import MainSidebar from './main-sidebar';
import AppHeader from '@/components/organisms/app-header';
import { PageTitle } from '../atoms/page-title';
import { BreadcrumbProvider } from '../atoms/breadcrumb-context';
import { useEffect, useState } from 'react';
import { useProject } from '@/lib/api/queries';

export default function LayoutSidebar({
  children,
  className,
  containerClassName,
  contentClassName,
  isOpen,
  title,
  titleActions,
  breadcrumbLabelOverride,
  projectBreadcrumbLabelOverride,
  projectIdForBreadcrumb,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  isOpen?: boolean;
  title?: React.ReactNode;
  titleActions?: React.ReactNode;
  breadcrumbLabelOverride?: string;
  projectBreadcrumbLabelOverride?: string;
  projectIdForBreadcrumb?: string;
}) {
  const currentUser = useCurrentUser();
  const sidebarOpen = isOpen ?? (currentUser.data?.id || currentUser.isLoading ? undefined : false);
  const [sidebarWidthPx, setSidebarWidthPx] = useState(0);
  const { data: breadcrumbProject } = useProject(projectIdForBreadcrumb || '', undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const findVisibleSidebarEl = (): HTMLElement | null => {
      const sidebarEls = Array.from(document.querySelectorAll<HTMLElement>('[data-sidebar="sidebar"]'));
      for (const el of sidebarEls) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return el;
      }
      return null;
    };

    const updateWidth = () => {
      const el = findVisibleSidebarEl();
      setSidebarWidthPx(el ? Math.round(el.getBoundingClientRect().width) : 0);
    };

    updateWidth();

    const el = findVisibleSidebarEl();
    let ro: ResizeObserver | null = null;
    if (el && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => updateWidth());
      ro.observe(el);
    }

    const onResize = () => updateWidth();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (ro && el) ro.unobserve(el);
    };
  }, []);

  return (
    <>
      <SidebarProvider open={sidebarOpen}>
        <MainSidebar />

        <BreadcrumbProvider value={{ currentPageLabel: breadcrumbLabelOverride, projectLabelOverride: projectBreadcrumbLabelOverride || breadcrumbProject?.name }}>
          <main className={cn('flex-1 flex flex-col min-h-svh bg-background', containerClassName)}>
            {/* Fixed header aligned after the sidebar (responsive to sidebar width/icon) */}
            <header
              className="fixed top-0 right-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
              style={{ left: sidebarWidthPx }}
            >
              <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8 w-full">
                <AppHeader fullWidth={true} showSidebarTriggerOnMobile={true} />
              </div>
            </header>
            {/* Spacer to offset fixed header height */}
            <div aria-hidden className="h-16" />

            <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8 py-6 w-full">
              <div className="pb-3 min-w-0">
                <PageTitle title={title} actions={titleActions} />
              </div>

              <div className={cn('flex-1 min-w-0 pb-8 pt-4', className)}>
                <div className={cn('flex-1 min-w-0', contentClassName)}>
                  {children}
                </div>
              </div>
            </div>
          </main>
        </BreadcrumbProvider>
      </SidebarProvider>
    </>
  );
}
