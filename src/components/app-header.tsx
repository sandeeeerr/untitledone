"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User2, Monitor, LogOut } from "lucide-react";
import { useProfile } from "@/lib/api/queries";
import { useState } from "react";
import { SettingsModal } from "@/components/settings-modal";
import supabaseClient from "@/lib/supabase-client";

export function AppHeader({
  containerClassName,
  className,
  fullWidth = false,
  matchSidebarWidth = false,
}: {
  containerClassName?: string;
  className?: string;
  fullWidth?: boolean;
  matchSidebarWidth?: boolean;
}) {
  const { data: currentUser } = useCurrentUser();
  const { data: profile } = useProfile();
  const tLanding = useTranslations("landing");
  const tNav = useTranslations("navigation");
  const tActions = useTranslations("actions");
  const [showSettings, setShowSettings] = useState(false);

  const innerBase = fullWidth
    ? "w-full pr-4 flex h-16 items-center justify-between"
    : "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between";

  const onLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      alert(error.message);
    }
    window.location.reload();
  };

  return (
    <header className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className={cn(innerBase, containerClassName)}>
        <div className={cn(matchSidebarWidth ? "w-[18rem] flex items-center justify-center" : "flex items-center", "gap-2")}> 
          <Logo alt="Logo" width={40} height={28} />
        </div>
        <nav className="flex items-center gap-4">
          {currentUser ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">{tLanding("nav.dashboard")}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="User menu"
                    className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-accent hover:text-accent-foreground"
                  >
                    <User2 className="h-[1.1rem] w-[1.1rem]" />
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