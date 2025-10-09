"use client"

import { useDeferredValue, useMemo, useState } from "react"
import LayoutSidebar from "@/components/organisms/layout-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import UserAvatar from "@/components/atoms/user-avatar"
import EmptyState from "@/components/atoms/empty-state"
import { Plus, Loader2, Search, Filter, FileAudio, Users, Calendar, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import PageLoading from "@/components/atoms/page-loading"
import { ProjectCardSkeletonGrid } from "@/components/atoms/skeletons"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useProjects } from "@/lib/api/queries"
import { type Project } from "@/lib/api/projects"
import { formatRelativeTimeWithTranslations } from "@/lib/utils/time"
import { getPaginationWindow } from "@/lib/utils/pagination"
import Toolbar from "@/components/molecules/toolbar"

// ExtendedProject is no longer needed since Project type now includes these fields

export default function ProjectsPage() {
  const t = useTranslations("projects")
  const { data: projects = [], isLoading, error, refetch } = useProjects()

  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all")
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "name" | "likes">("updated_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const projectsPerPage = 6

  // Projects now come with the correct fields from the API

  const { filteredProjects, totalPages, paginatedProjects } = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()
    let filtered: Project[] = projects

    if (normalizedQuery) {
      filtered = filtered.filter((project) => {
        const haystacks = [project.name, project.description ?? "", project.genre ?? ""].map((s) =>
          s.toLowerCase(),
        )
        return haystacks.some((text) => text.includes(normalizedQuery))
      })
    }

    if (visibilityFilter !== "all") {
      filtered = filtered.filter((project) =>
        visibilityFilter === "private" ? project.is_private : !project.is_private,
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name": {
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
          return sortOrder === "asc" ? aName.localeCompare(bName, undefined, { numeric: true }) : bName.localeCompare(aName, undefined, { numeric: true })
        }
        
        case "created_at": {
          const aDate = new Date(a.created_at).getTime()
          const bDate = new Date(b.created_at).getTime()
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate
        }
        default: {
          const aDate = new Date(a.updated_at).getTime()
          const bDate = new Date(b.updated_at).getTime()
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate
        }
      }
    })

    const totalPages = Math.ceil(sorted.length / projectsPerPage)
    const startIndex = (currentPage - 1) * projectsPerPage
    const endIndex = startIndex + projectsPerPage
    const paginated = sorted.slice(startIndex, endIndex)

    return {
      filteredProjects: sorted,
      totalPages,
      paginatedProjects: paginated
    }
  }, [projects, deferredSearchQuery, visibilityFilter, sortBy, sortOrder, currentPage, projectsPerPage])

  // Reset to page 1 only when search query or visibility filter changes (not sort changes)
  const prevSearchQuery = useMemo(() => deferredSearchQuery, [deferredSearchQuery])
  const prevVisibilityFilter = useMemo(() => visibilityFilter, [visibilityFilter])
  
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(Math.max(1, totalPages))
    }
  }, [currentPage, totalPages])

  useMemo(() => {
    if (prevSearchQuery !== deferredSearchQuery || prevVisibilityFilter !== visibilityFilter) {
      setCurrentPage(1)
    }
  }, [prevSearchQuery, deferredSearchQuery, prevVisibilityFilter, visibilityFilter])

  if (isLoading) {
    return (
      <LayoutSidebar title={t("title")}>
        <div>
          <div className="mb-6 h-8 w-48" />
          <ProjectCardSkeletonGrid count={6} />
        </div>
      </LayoutSidebar>
    )
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : t("error.loadFailed")
    return (
      <LayoutSidebar
        title={t("title")}
        titleActions={
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new.title")}
            </Link>
          </Button>
        }
      >
        <div>
          <EmptyState
            title={t("error.title")}
            description={errorMessage}
            className="py-12"
          >
            <Button onClick={() => refetch()}>{t("error.tryAgain")}</Button>
          </EmptyState>
        </div>
      </LayoutSidebar>
    )
  }

  return (
    <LayoutSidebar
      title={t("title")}
      titleActions={
        <Button size="sm" asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("new.title")}
          </Link>
        </Button>
      }
    >
      <div>
        <div className="mb-8 space-y-4">
          <Toolbar className="flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label={t("searchPlaceholder")}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select
                value={visibilityFilter}
                onValueChange={(value) => setVisibilityFilter(value as "all" | "public" | "private")}
              >
                <SelectTrigger className="w-auto gap-1">
                  <Filter className="mr-1 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="public">{t("public")}</SelectItem>
                  <SelectItem value="private">{t("private")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger className="w-auto gap-1">
                  <Calendar className="mr-1 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">{t("sort.updated_at")}</SelectItem>
                  <SelectItem value="created_at">{t("sort.created_at")}</SelectItem>
                  <SelectItem value="name">{t("sort.name")}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                aria-label={t("sort.toggleOrder")}
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </Toolbar>

          {/* Results count and pagination info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t("resultsCount", { count: filteredProjects.length, total: projects.length })}
              {totalPages > 1 && (
                <span className="ml-2">
                  • Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
          
        </div>

        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            title={deferredSearchQuery || visibilityFilter !== "all" ? t("empty.noResults") : t("empty.message")}
            className="py-12"
          >
            {!deferredSearchQuery && visibilityFilter === "all" && (
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("empty.createFirst")}
                </Link>
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="group">
                  <Card className="transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <Badge variant={project.is_private ? "secondary" : "default"} className={project.is_private ? "shrink-0" : "shrink-0 bg-green-500 hover:bg-green-600"}>
                          {project.is_private ? t("private") : t("public")}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                    {/* Creator info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        className="h-8 w-8 shrink-0"
                        name={project.creator?.name}
                        username={undefined}
                        userId={project.creator?.id}
                        src={project.creator?.avatar || null}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.creator?.name || t("unknownCreator")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTimeWithTranslations(project.updated_at, {
                            justNow: t("time.justNow"),
                            hoursAgo: (count) => t("time.hoursAgo", { count }),
                            yesterday: t("time.yesterday"),
                            daysAgo: (count) => t("time.daysAgo", { count })
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Description - reserve two-line height even when empty */}
                    <div className="min-h-12">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description || "\u00A0"}
                      </p>
                    </div>


                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileAudio className="h-3 w-3" />
                          <span>{project.file_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{project.collaborators_count ?? 1}</span>
                        </div>
                      </div>
                      {/* Likes removed */}
                    </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gap-2"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {getPaginationWindow(currentPage, totalPages).map((page, index) => (
                    page === "ellipsis" ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8"
                        aria-label={`Go to page ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    )
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="gap-2"
                  aria-label="Go to next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSidebar>
  )
}
