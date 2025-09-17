"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupAction,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import {
  Home,
  FolderClosed,
  Plus,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useProfile, useRecentProjects } from "@/lib/api/queries"
import { UserAvatar } from "@/components/atoms/user-avatar"

// Menu items
const items: Array<{
  titleKey: string
  url: string
  icon: LucideIcon
}> = [
  {
    titleKey: "navigation.projects",
    url: "/projects",
    icon: FolderClosed,
  },
]

export default function MainSidebar() {
  const pathname = usePathname()
  const t = useTranslations()
  const { data: recent } = useRecentProjects(6)
  const { data: profile } = useProfile()

  return (
    <Sidebar collapsible="icon" className="data-[state=collapsed]:w-16">
      <SidebarHeader className="h-16 flex-row items-center justify-between p-4 group-data-[state=collapsed]:p-2">
        <div className="group/menu-item relative group-data-[state=collapsed]:hidden">
          <div className="flex w-auto h-8 items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>span:last-child]:truncate">
            <Logo alt="Logo" width={16} height={16} className="h-4 w-4" />
            <span className="truncate">UntitledOne</span>
          </div>
        </div>
        <SidebarTrigger className="h-8 w-8 group-data-[state=collapsed]:ml-0 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none ring-sidebar-ring focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={pathname === "/dashboard" ? "bg-accent" : ""}>
                  <Link href="/dashboard">
                    <Home />
                    <span>{t("navigation.dashboard")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">{t("navigation.mainMenu")}</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link href="/projects/new" aria-label={t("projects.new.title")}>
              <Plus />
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild className={pathname === item.url ? "bg-accent" : ""}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">{t("navigation.recent")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(recent ?? []).map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/projects/${p.id}`}>
                      <FolderClosed />
                      <span className="truncate max-w-[140px]">{p.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {profile?.username && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/u/${profile.username}`}>
                  <UserAvatar
                    name={profile.display_name ?? profile.username}
                    username={profile.username}
                    userId={profile.id}
                    src={profile.avatar_url}
                  />
                  <span className="truncate">{profile.display_name ?? profile.username}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
