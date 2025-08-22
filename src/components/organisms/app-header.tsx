"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User2, Monitor, LogOut } from "lucide-react";
import UserAvatar from "@/components/atoms/user-avatar";
import { useProfile } from "@/lib/api/queries";
import { useState } from "react";
import { SettingsModal } from "@/components/molecules/settings-modal";
import supabaseClient from "@/lib/supabase-client";

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
  const [showSettings, setShowSettings] = useState(false);

  const innerBase = fullWidth
    ? "w-full flex h-16 items-center justify-between"
    : "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between";

  const onLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      alert(error.message);
    }
    window.location.reload();
  };

  return (
    <header>
      <div className={cn(innerBase, containerClassName)}>
        <div className={cn(matchSidebarWidth ? "w-[18rem] flex items-center justify-center" : "flex items-center", "gap-2")}> 
          {showSidebarTriggerOnMobile ? (
            <SidebarTrigger className="md:hidden h-8 w-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none ring-sidebar-ring focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0" />
          ) : null}
        </div>
        <nav className="flex items-center gap-4">
          {currentUser ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">{tLanding("nav.dashboard")}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="User menu" className="rounded-full">
                    <UserAvatar
                      className="h-9 w-9 border"
                      name={profile?.display_name || null}
                      username={profile?.username || null}
                      userId={currentUser.id}
                      src={profile?.avatar_url || null}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={profile?.username ? `/u/${profile.username}` : "/dashboard"}>
                      <User2 className="h-[1.1rem] w-[1.1rem]" />
                      <span className="ml-2">{tNav("profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Monitor className="h-[1.1rem] w-[1.1rem]" />
                    <span className="ml-2">{tActions("openSettings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="h-[1.1rem] w-[1.1rem]" />
                    <span className="ml-2">{tActions("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">{tLanding("nav.login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">{tLanding("nav.signup")}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default AppHeader; 