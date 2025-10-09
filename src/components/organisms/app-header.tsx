"use client";

import { useTranslations } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import ModeToggle from "@/components/molecules/mode-toggle";
import { LangToggle } from "@/components/atoms/lang-toggle";
import { Breadcrumbs } from "@/components/atoms/breadcrumbs";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function AppHeader({
  containerClassName,
  fullWidth = false,
  matchSidebarWidth = false,
  showSidebarTriggerOnMobile = false,
}: {
  containerClassName?: string;
  fullWidth?: boolean;
  matchSidebarWidth?: boolean;
  showSidebarTriggerOnMobile?: boolean;
}) {
  const { data: currentUser } = useCurrentUser();
  const breadcrumbs = useBreadcrumbs();
  const t = useTranslations("breadcrumbs");

  const innerBase = fullWidth
    ? "w-full flex items-center justify-between gap-4 py-2 min-h-12"
    : "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 py-2 min-h-12";

  return (
    <header>
      <div className={cn(innerBase, containerClassName)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showSidebarTriggerOnMobile && (
            <SidebarTrigger className="md:hidden h-8 w-8 flex-shrink-0 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none ring-sidebar-ring focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0" />
          )}
          
          {/* Breadcrumbs - hidden on small screens, wrap on overflow */}
          <div className="hidden sm:block min-w-0 flex-1 overflow-x-auto">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
        
        {/* Actions - language toggle and theme toggle */}
        <nav className="flex items-center gap-2 flex-shrink-0">
          <LangToggle />
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}

export default AppHeader; 