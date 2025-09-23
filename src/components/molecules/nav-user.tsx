"use client"

import { Bell, ChevronsUpDown, LogOut, User2 } from "lucide-react"
import UserAvatar from "@/components/atoms/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useMyStorageUsage } from "@/lib/api/queries"
import supabaseClient from "@/lib/supabase-client"
import Link from "next/link"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string | null | undefined
    profileUrl?: string
    userId?: string | null
    username?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const { data: usage } = useMyStorageUsage()

  const onLogout = async () => {
    await supabaseClient.auth.signOut()
    if (typeof window !== "undefined") window.location.reload()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className="px-2 group-data-[collapsible=icon]:px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"
            >
              <UserAvatar className="h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" name={user.name} username={user.username ?? null} userId={user.userId ?? null} src={user.avatar ?? null} />
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar className="h-8 w-8" name={user.name} username={user.username ?? null} userId={user.userId ?? null} src={user.avatar ?? null} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {user.profileUrl && (
                <DropdownMenuItem asChild>
                  <Link href={user.profileUrl}>
                    <User2 />
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Storage</span>
                <span>
                  {typeof usage?.mbUsed === "number" && typeof usage?.mbMax === "number"
                    ? `${usage.mbUsed}MB / ${usage.mbMax}MB`
                    : `-- / --`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, usage?.percentUsed ?? 0)}%` }} />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default NavUser


