"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ModeToggle from "@/components/molecules/mode-toggle";
import LanguageToggle from "@/components/molecules/language-toggle";
import { useProfile } from "@/lib/api/queries";
import { useState } from "react";
import { SettingsModal } from "@/components/molecules/settings-modal";
import { useTheme } from "next-themes";
import { setLanguageCookie } from "@/lib/cookies";
import { useRouter } from "next/navigation";

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
  const { data: profile } = useProfile();
  const tLanding = useTranslations("landing");
  const tNav = useTranslations("navigation");
  const tActions = useTranslations("actions");
  const t = useTranslations("common");
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const innerBase = fullWidth
    ? "w-full flex h-16 items-center justify-between"
    : "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between";

  const onLanguageChange = (locale: string) => {
    setLanguageCookie(locale);
    router.refresh();
  };

  return (
    <header>
      <div className={cn(innerBase, containerClassName)}>
        <div className={cn(matchSidebarWidth ? "w-[18rem] flex items-center justify-center" : "flex items-center", "gap-2")}> 
          {showSidebarTriggerOnMobile ? (
            <SidebarTrigger className="md:hidden h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none ring-sidebar-ring focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0" />
          ) : null}
        </div>
        <nav className="flex items-center gap-2">
          <ModeToggle />
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}

export default AppHeader; 