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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { Home, FolderClosed, Plus, Upload, UserPlus, Bell, ChevronRight, Star, AtSign, Compass } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useProfile, useProjects, usePinnedProjects, usePinProject, useUnpinProject } from "@/lib/api/queries"
import { getProjectActivity } from "@/lib/api/projects"
import { useQueries } from "@tanstack/react-query"
import NavUser from "@/components/molecules/nav-user"
import SidebarStorageCard from "@/components/molecules/sidebar-storage-card"
import UploadDialog from "@/components/molecules/upload-dialog"
import CreateVersionDialog from "@/components/molecules/create-version-dialog"
import InviteDialog from "@/components/molecules/invite-dialog"
import { cn } from "@/lib/utils"

export default function MainSidebar() {
  const pathname = usePathname()
  const t = useTranslations()
  const { data: profile } = useProfile()
  const { data: allProjects = [] } = useProjects()
  const { data: pins = [] } = usePinnedProjects()
  const pinMut = usePinProject()
  const unpinMut = useUnpinProject()
  const isProjectRoute = pathname?.startsWith("/projects/") && !pathname?.startsWith("/projects/new")
  const projectId = isProjectRoute ? pathname.split("/")[2] : null
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})

  const pinnedIds = React.useMemo(() => new Set((pins ?? []).map(p => p.project_id)), [pins])
  const pinnedProjects = React.useMemo(() => allProjects.filter(p => pinnedIds.has(p.id)).slice(0, 3), [allProjects, pinnedIds])
  // Fetch activity for recent candidates to sort by last action
  const recentCandidates = React.useMemo(() => {
    // Start from all projects to avoid missing recently updated ones
    let list = allProjects.filter(p => !pinnedIds.has(p.id))
    const active = projectId ? allProjects.find(p => p.id === projectId) : undefined
    if (active && !pinnedIds.has(active.id) && !list.some(p => p.id === active.id)) {
      list = [active, ...list]
    }
    // Unique by id
    const seen = new Set<string>()
    const uniq: typeof list = []
    for (const p of list) {
      if (!seen.has(p.id)) { seen.add(p.id); uniq.push(p) }
    }
    return uniq
  }, [pinnedIds, allProjects, projectId])

  const activityQueries = useQueries({
    queries: recentCandidates.slice(0, 12).map((p) => ({
      queryKey: ["project", p.id, "activity", "summary"],
      queryFn: () => getProjectActivity(p.id),
      staleTime: 60 * 1000,
      enabled: Boolean(p?.id),
    })),
  })

  const idToLastTs = React.useMemo(() => {
    const map = new Map<string, number>()
    recentCandidates.forEach((p, idx) => {
      const q = activityQueries[idx]
      let ts = new Date(p.updated_at).getTime()
      const act = q?.data
      if (Array.isArray(act)) {
        for (const v of act) {
          const vd = new Date(v.date).getTime()
          if (!Number.isNaN(vd)) ts = Math.max(ts, vd)
          for (const mc of v.microChanges) {
            const mcts = new Date(mc.fullTimestamp).getTime()
            if (!Number.isNaN(mcts)) ts = Math.max(ts, mcts)
          }
        }
      }
      map.set(p.id, ts)
    })
    return map
  }, [activityQueries, recentCandidates])

  const sortedRecents = React.useMemo(() => {
    const getTs = (pId: string) => idToLastTs.get(pId) ?? new Date(allProjects.find(p => p.id === pId)?.updated_at ?? 0).getTime()
    return [...recentCandidates].sort((a, b) => (getTs(b.id) - getTs(a.id)))
  }, [recentCandidates, idToLastTs, allProjects])
  const [recentsToShow, setRecentsToShow] = React.useState(4)

  const toggleOpen = (id: string) => setOpenMap(prev => ({ ...prev, [id]: !prev[id] }))
  const togglePinned = (id: string, isPinned: boolean) => {
    if (isPinned) unpinMut.mutate(id)
    else pinMut.mutate(id)
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
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only flex items-center justify-between">
            <span>{t("navigation.mainMenu")}</span>
          </SidebarGroupLabel>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={pathname === "/projects" ? "bg-accent" : ""}>
                  <Link href="/projects">
                    <FolderClosed />
                    <span>{t("projects.filters.all")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Compass className="h-4 w-4" />
                  <span>{t("navigation.explore")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Storage info between header and profile (appears in user dropdown now) */}

        {/* Beta bug report CTA moved to footer */}

        {/* Collaboration & community */}
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">{t("navigation.collaboration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="justify-between" disabled>
                  <div className="flex items-center gap-2"><Bell className="h-4 w-4" /><span>{t("navigation.notifications")}</span></div>
                </SidebarMenuButton>
                <SidebarMenuBadge>0</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <UserPlus className="h-4 w-4" />
                  <span>{t("navigation.invitations")}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>0</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Coming soon" disabled>
                  <AtSign className="h-4 w-4" />
                  <span>{t("navigation.mentions")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects: pinned then recent */}
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">Projects</SidebarGroupLabel>
          <SidebarGroupContent className="max-h-[50vh] overflow-y-auto pr-1">
            <SidebarMenu>
              {pinnedProjects.map((p) => {
                const isActive = projectId === p.id
                const isOpen = openMap[p.id] ?? isActive
                return (
                  <SidebarMenuItem key={`pinned-${p.id}`}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={`/projects/${p.id}`}>
                        <FolderClosed />
                        <span className="truncate max-w-[140px]">{p.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction className={cn("right-1 transition-transform", isOpen && "rotate-90")} onClick={() => toggleOpen(p.id)}>
                      <ChevronRight />
                    </SidebarMenuAction>
                    <SidebarMenuAction className="right-7" onClick={() => togglePinned(p.id, true)}>
                      <Star className="text-yellow-500" />
                    </SidebarMenuAction>
                    {isOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <UploadDialog
                            projectId={p.id}
                            trigger={
                              <SidebarMenuSubButton asChild>
                                <a href="#">
                                  <Upload />
                                  <span>{t("projects.quick.uploadFiles")}</span>
                                </a>
                              </SidebarMenuSubButton>
                            }
                          />
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <CreateVersionDialog
                            projectId={p.id}
                            trigger={
                              <SidebarMenuSubButton asChild>
                                <a href="#">
                                  <Plus />
                                  <span>{t("projects.quick.newVersion")}</span>
                                </a>
                              </SidebarMenuSubButton>
                            }
                          />
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <InviteDialog
                            projectId={p.id}
                            trigger={
                              <SidebarMenuSubButton asChild>
                                <a href="#">
                                  <UserPlus />
                                  <span>{t("projects.quick.invite")}</span>
                                </a>
                              </SidebarMenuSubButton>
                            }
                          />
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
              {sortedRecents.slice(0, recentsToShow).map((p) => {
                const isActive = projectId === p.id
                const isPinned = pinnedIds.has(p.id)
                const isOpen = openMap[p.id] ?? (isActive && !isPinned)
                return (
                  <SidebarMenuItem key={`recent-${p.id}`}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={`/projects/${p.id}`}>
                        <FolderClosed />
                        <span className="truncate max-w-[140px]">{p.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction className={cn("right-1 transition-transform", isOpen && "rotate-90")} onClick={() => toggleOpen(p.id)}>
                      <ChevronRight />
                    </SidebarMenuAction>
                    <SidebarMenuAction className="right-7" onClick={() => togglePinned(p.id, isPinned)}>
                      <Star className={isPinned ? "text-yellow-500" : "opacity-40"} />
                    </SidebarMenuAction>
                    {!isPinned && isOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <UploadDialog
                            projectId={p.id}
                            trigger={
                              <SidebarMenuSubButton asChild>
                                <a href="#">
                                  <Upload />
                                  <span>{t("projects.quick.uploadFiles")}</span>
                                </a>
                              </SidebarMenuSubButton>
                            }
                          />
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <CreateVersionDialog
                            projectId={p.id}
                            trigger={
                              <SidebarMenuSubButton asChild>
                                <a href="#">
                                  <Plus />
                                  <span>{t("projects.quick.newVersion")}</span>
                                </a>
                              </SidebarMenuSubButton>
                            }
                          />
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <InviteDialog
                            projectId={p.id}
                            trigger={
                              <SidebarMenuSubButton asChild>
                                <a href="#">
                                  <UserPlus />
                                  <span>{t("projects.quick.invite")}</span>
                                </a>
                              </SidebarMenuSubButton>
                            }
                          />
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
              {sortedRecents.length > recentsToShow && (
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" onClick={() => setRecentsToShow((v) => Math.min(v + 4, sortedRecents.length))}>
                    <span>{t("projects.showMore")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 w-full group-data-[collapsible=icon]:hidden">
          <SidebarStorageCard />
        </div>
        {profile?.username && (
          <NavUser
            user={{
              name: profile.display_name ?? profile.username ?? "",
              email: "",
              avatar: profile.avatar_url ?? undefined,
              profileUrl: `/u/${profile.username}`,
              userId: profile.id,
              username: profile.username,
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
