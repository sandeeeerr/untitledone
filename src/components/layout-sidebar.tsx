'use client';

import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/use-current-user';
import MainSidebar from './main-sidebar';

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
    <SidebarProvider open={sidebarOpen}>
      <MainSidebar />

      <main className={cn('flex-1 flex flex-col overflow-auto', containerClassName)}>
        {/* {sidebarOpen !== false ? <SidebarTrigger className="mx-3 mt-2" /> : null} */}
        <div className={cn('flex-1 px-4 py-16 bg-background', className)}>
          <div className={cn('flex-1 container max-w-screen-lg mx-auto', contentClassName)}>
            {title || titleActions ? (
              <div className="py-0 flex items-center justify-between gap-3">
                {title ? (
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                ) : (
                  <div />
                )}
                {titleActions ? <div className="shrink-0">{titleActions}</div> : null}
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
