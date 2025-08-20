"use client"

import { useEffect, useMemo, useState } from "react"
import LayoutSidebar from "@/components/layout-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Loader2, Search, Filter, Heart, FileAudio, Users, Calendar, ArrowUpDown } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { getProjects, type Project } from "@/lib/api/projects"
import { useToast } from "@/hooks/use-toast"

interface ExtendedProject extends Project {
  creator?: {
    id: string
    name: string
    avatar?: string
  }
  file_count?: number
  collaborators_count?: number
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  } catch {
    return value
  }
}

// Localized time-ago formatting will be handled inline where translations are available

export default function ProjectsPage() {
  const t = useTranslations("projects")
  const { toast } = useToast()
  const [projects, setProjects] = useState<ExtendedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all")
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "name" | "likes">("updated_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)
        const data = await getProjects()

        const extendedData: ExtendedProject[] = (data as ExtendedProject[]).map((project) => ({
          ...project,
          file_count: project.file_count ?? 0,
          collaborators_count: project.collaborators_count ?? 0,
        }))

        setProjects(extendedData)
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : t("error.loadFailed")
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: t("error.title"),
          description: errorMessage,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [toast, t])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let filtered: ExtendedProject[] = projects

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
          return sortOrder === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
        }
        case "likes": {
          const aLikes = a.likes_count
          const bLikes = b.likes_count
          return sortOrder === "asc" ? aLikes - bLikes : bLikes - aLikes
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

    return sorted
  }, [projects, searchQuery, visibilityFilter, sortBy, sortOrder])

  if (loading) {
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
        <div className="container py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t("loading")}</span>
          </div>
        </div>
      </LayoutSidebar>
    )
  }

  if (error) {
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
        <div className="container py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>{t("error.tryAgain")}</Button>
          </div>
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
      <div className="container py-6">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
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
                  <SelectItem value="likes">{t("sort.likes")}</SelectItem>
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
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">{t("resultsCount", { count: filteredProjects.length, total: projects.length })}</div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{searchQuery || visibilityFilter !== "all" ? t("empty.noResults") : t("empty.message")}</p>
            {!searchQuery && visibilityFilter === "all" && (
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("empty.createFirst")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="group transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <Badge variant={project.is_private ? "secondary" : "default"} className="shrink-0">
                        {project.is_private ? t("private") : t("public")}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Creator info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={project.creator?.avatar || "/placeholder.svg"} alt={project.creator?.name} />
                        <AvatarFallback className="text-xs">{project.creator?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.creator?.name || t("unknownCreator")}</p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              const date = new Date(project.updated_at)
                              const now = new Date()
                              const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

                              if (diffInHours < 1) return t("time.justNow")
                              if (diffInHours < 24) return t("time.hoursAgo", { count: diffInHours })
                              if (diffInHours < 48) return t("time.yesterday")
                              if (diffInHours < 168) return t("time.daysAgo", { count: Math.floor(diffInHours / 24) })
                              return formatDate(project.updated_at)
                            } catch {
                              return project.updated_at
                            }
                          })()}
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
                          <span>{project.file_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{project.collaborators_count || 1}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        <span>{project.likes_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </LayoutSidebar>
  )
}
