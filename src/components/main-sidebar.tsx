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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import {
  Home,
  ListChecksIcon as ListCheck,
  type LightbulbIcon as LucideProps,
  FolderClosed,
  Compass,
  TrendingUp,
  Files,
  ActivityIcon,
  CheckSquare,
} from "lucide-react"
import Link from "next/link"
import supabaseClient from "@/lib/supabase-client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { usePathname } from "next/navigation"
import { type ForwardRefExoticComponent, type RefAttributes, useState } from "react"
import { useTranslations } from "next-intl"
import { useProfile } from "@/lib/api/queries"

// Menu items
const items: Array<{
  titleKey: string
  url: string
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
}> = [
  {
    titleKey: "navigation.todos",
    url: "/todos",
    icon: ListCheck,
  },
  {
    titleKey: "navigation.projects",
    url: "/projects",
    icon: FolderClosed,
  },
]

export default function MainSidebar() {
  const currentUser = useCurrentUser()
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)
  const t = useTranslations()
  const { data: profile } = useProfile()
  

  const _logout = async () => {
    const { error } = await supabaseClient.auth.signOut()
    if (error) {
      alert(error.message)
    }

    window.location.reload()
  }

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
                    <span>{t("navigation.home")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <TrendingUp />
                  <span>{t("navigation.popular")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Compass />
                  <span>{t("navigation.explore")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">{t("navigation.mainMenu")}</SidebarGroupLabel>
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
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Files />
                  <span>{t("navigation.files")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <ActivityIcon />
                  <span>{t("navigation.activity")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <CheckSquare />
                  <span>{t("navigation.tasks")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">{t("navigation.recent")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {["Project One", "Summer Mix 2025", "Collab with Nora", "Live Set Draft"].map((name) => (
                <SidebarMenuItem key={name}>
                  <SidebarMenuButton disabled>
                    <FolderClosed />
                    <span>{name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
