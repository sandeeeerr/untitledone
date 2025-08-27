"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock, MessageSquare, ChevronDown, ChevronUp, MessageSquarePlus, File as FileIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/atoms/user-avatar";
import EmptyState from "@/components/atoms/empty-state";
import ActivitySkeleton from "@/components/atoms/activity-skeleton";
import { useProjectActivity } from "@/lib/api/queries";
import CreateVersionDialog from "@/components/molecules/create-version-dialog";
import CreateFeedbackDialog from "@/components/molecules/create-feedback-dialog";
import EditVersionDialog from "@/components/molecules/edit-version-dialog";

import ThreadedComments from "@/components/molecules/threaded-comments";
import { useProjectComments, useCommentsCount, useCreateFeedbackChange, useUpdateFeedbackChange, useDeleteFeedbackChange } from "@/lib/api/queries";
import Link from "next/link";
import { 
  getChangeIcon, 
  getChangePrefix, 
  getFileIcon, 
  getGroupLabel, 
  formatTimeAgo, 
  truncateText, 
  safeDateParse, 
  compareVersions,
  ProjectActivityChangeType
} from "@/lib/ui/activity";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface ProjectActivityMicroChange {
  id: string;
  type: ProjectActivityChangeType;
  description: string;
  author: string;
  authorId: string;
  time: string; // HH:mm or relative
  fullTimestamp: string; // ISO timestamp for accurate sorting
  avatar?: string | null;
  filename?: string; // optional file reference to preview
  fileId?: string | null;
}

export interface ProjectActivityVersion {
  id?: string;
  version: string; // e.g., v1.0
  description: string;
  author: string;
  date: string; // ISO date or human-readable range
  avatar?: string | null;
  microChanges: ProjectActivityMicroChange[];
  isActive?: boolean; // highlight as current active version
}

interface ProjectActivityProps {
  projectId: string;
  query?: string;
  sortBy?: 'newest' | 'oldest';
  onRetry?: () => void;
  onVersionCreated?: () => void;
  members?: Array<{
    user_id: string;
    profile?: {
      display_name?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
}

export default function ProjectActivity({ projectId, query, sortBy = 'newest', onRetry, onVersionCreated, members }: ProjectActivityProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const { data: versions, isLoading, error, refetch } = useProjectActivity(projectId)
  const { data: me } = useCurrentUser();
  const locale = useLocale()
  const deferredQuery = useDeferredValue(query ?? "")
  const t = useTranslations('activity')
  const updateFeedback = useUpdateFeedbackChange(projectId)
  const deleteFeedback = useDeleteFeedbackChange(projectId)

  
  const toggleComments = (changeId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedComments(newExpanded);
  };


  
  // Child component to lazily fetch and render threaded comments for a change
  function ChangeComments({ changeId, expanded }: { changeId: string; expanded: boolean }) {
    const { data: comments = [], isLoading } = useProjectComments({ projectId, activityChangeId: changeId, limit: 200 }, { enabled: expanded });
    if (!expanded) return null;
    return (
      <div className="mt-2">
        <ThreadedComments projectId={projectId} context={{ activityChangeId: changeId }} comments={comments} isLoading={isLoading} />
      </div>
    );
  }

  // Comment button component with count (only for non-file feedback changes)
  const CommentButton = ({ changeId }: { changeId: string }) => {
    const isExpanded = expandedComments.has(changeId);
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(changeId);
    const { data: count = 0 } = useCommentsCount(
      { projectId, activityChangeId: changeId },
      { enabled: isUuid, staleTime: 60_000 }
    );
    const label = count === 0 ? 'Reageren' : isExpanded ? 'Verberg reacties' : `Toon ${count} reacties`;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleComments(changeId)}
        className="h-auto py-1 px-2 text-xs flex items-center gap-1.5"
        aria-label={label}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{label}</span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
    );
  };

  // File CTAs (for file add/update and file-linked feedback)
  const FileCTAs = ({ fileId, commentAnchor }: { fileId: string; commentAnchor?: string }) => {
    const { data: count = 0 } = useCommentsCount({ projectId, fileId }, { enabled: Boolean(fileId), staleTime: 60_000 });
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs gap-1.5">
          <Link href={`/projects/${projectId}/files/${fileId}`}>
            <FileIcon className="h-3.5 w-3.5" />
            <span>Toon bestand</span>
          </Link>
        </Button>
        {count > 0 && (
          <Button asChild variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs gap-1.5">
            <Link href={`/projects/${projectId}/files/${fileId}${commentAnchor ? `#${commentAnchor}` : '#comments'}`}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{`Toon ${count} reacties`}</span>
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Helper function to find member data by author name
  const findMemberByAuthor = (authorName: string) => {
    if (!members) return null;
    
    // Try to match by display name first, then by username
    return members.find(member => 
      member.profile?.display_name === authorName || 
      member.profile?.username === authorName
    ) || null;
  }

  // Memoized sorting and filtering
  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    
    return [...versions].sort((a, b) => {
      const aDate = safeDateParse(a.date);
      const bDate = safeDateParse(b.date);
      const dateDiff = sortBy === 'oldest' ? aDate - bDate : bDate - aDate;
      
      // If dates are equal, sort by version name for stability
      if (dateDiff === 0) {
        return compareVersions(a.version, b.version, locale);
      }
      return dateDiff;
    });
  }, [versions, sortBy, locale]);

  const filteredVersions = useMemo(() => {
    if (!sortedVersions.length) return [];
    
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return sortedVersions;

    return sortedVersions.map(version => ({
      ...version,
      microChanges: version.microChanges.filter(change => {
        const searchFields = [
          version.version,
          version.description,
          change.description,
          change.author,
          change.filename ?? ""
        ].join(" ").toLowerCase();
        
        return searchFields.includes(normalizedQuery);
      })
    })).filter(version => version.microChanges.length > 0);
  }, [sortedVersions, deferredQuery]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <section aria-labelledby="activity-heading">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle id="activity-heading" className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6" aria-live="polite">
            <ActivitySkeleton />
          </CardContent>
        </Card>
      </section>
    )
  }

  if (error) {
    return (
      <section aria-labelledby="activity-heading">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle id="activity-heading" className="text-base">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <EmptyState 
              title={t('failedToLoad')} 
              description={t('problemLoadingData')}
            >
              <Button onClick={handleRetry} size="sm">
                {t('tryAgain')}
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!versions || versions.length === 0) {
    return (
      <section aria-labelledby="activity-heading">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle id="activity-heading" className="text-base">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <EmptyState 
              icon={<Clock className="h-12 w-12" />}
              title={t('noActivityYet')} 
              description={t('uploadsAndComments')}
            >
              <CreateVersionDialog
                projectId={projectId}
                onVersionCreated={onVersionCreated}
                trigger={<Button size="sm">{t('createFirstVersion')}</Button>}
              />
            </EmptyState>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Handle filtered empty state
  if (filteredVersions.length === 0 && deferredQuery.trim()) {
    return (
      <section aria-labelledby="activity-heading">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle id="activity-heading" className="text-base">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <EmptyState 
              title={t('noActivityFound')} 
              description={t('tryDifferentSearch')}
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="activity-heading">
      <div className="space-y-8 mt-8 overflow-x-hidden">
        {filteredVersions.map((version, idx) => {
          const currentLabel = getGroupLabel(version.date, locale);
          const prevLabel = idx > 0 ? getGroupLabel(filteredVersions[idx - 1].date, locale) : null;
          const showHeader = idx === 0 || currentLabel !== prevLabel;
          const isActive = version.isActive ?? idx === 0;
          const versionKey = `version-${version.version}-${idx}`;
          
          return (
            <div className="space-y-2" key={versionKey}>
              {showHeader && (
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {currentLabel}
                </div>
              )}
              <Card className="max-w-full overflow-hidden relative">
                {/* Active indicator using pseudo-element */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" aria-hidden="true" />
                )}
                <CardHeader className="p-4 pb-3 md:p-6 md:pb-0 max-w-full">
                <div className="flex items-start gap-3 min-w-0">
                  {(() => {
                    const member = findMemberByAuthor(version.author);
                    return (
                      <UserAvatar 
                        className="h-9 w-9 mt-1" 
                        name={member?.profile?.display_name || version.author}
                        username={member?.profile?.username || null}
                        userId={member?.user_id || null}
                        src={version.avatar || member?.profile?.avatar_url || null} 
                      />
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base font-semibold truncate">
                        {version.version}
                      </CardTitle>
                      {isActive && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const { truncated, isTruncated } = truncateText(version.description);
                      return (
                        <p 
                          className="text-sm text-muted-foreground truncate" 
                          title={isTruncated ? version.description : undefined}
                        >
                          {truncated}
                        </p>
                      );
                    })()}

                  </div>
                  <div className="flex items-center gap-2">
                    <CreateFeedbackDialog 
                      projectId={projectId}
                      versionId={version.id!}
                      onCreated={(id) => setExpandedComments(prev => new Set(prev).add(id))}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MessageSquarePlus className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <EditVersionDialog 
                      versionId={version.version}
                      currentName={version.version}
                      currentDescription={version.description}
                    />
                  </div>
                </div>
            </CardHeader>

                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3">
                    {version.microChanges.map((change) => {
                      const baseClasses = "flex flex-col gap-3 p-3 rounded-lg border w-full max-w-full";
                      const typeStyles = {
                        feedback: "bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30",
                        addition: "bg-green-50/30 border-green-100 dark:bg-green-950/10 dark:border-green-900/30",
                        update: "bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/30"
                      };

                      const isFeedback = change.type === "feedback";
                      const isFileLinked = Boolean(change.fileId);
                      return (
                        <div 
                          key={change.id} 
                          className={`${baseClasses} ${typeStyles[change.type] || typeStyles.update}`}
                        >
                          <div className="flex gap-3">
                            <div className="flex items-center gap-2 mt-0.5 shrink-0">
                              {getChangeIcon(change.type)}
                              {(() => {
                                const member = findMemberByAuthor(change.author);
                                return (
                                  <UserAvatar 
                                    className="h-6 w-6" 
                                    name={member?.profile?.display_name || change.author}
                                    username={member?.profile?.username || null}
                                    userId={member?.user_id || null}
                                    src={change.avatar || member?.profile?.avatar_url || null} 
                                  />
                                );
                              })()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm break-words ${change.type === "feedback" ? "italic text-blue-700 dark:text-blue-300" : ""}`}>
                                  <span className={`font-medium ${
                                    change.type === "addition" ? "text-green-700 dark:text-green-300 mr-1" :
                                    change.type === "feedback" ? "text-blue-700 dark:text-blue-300" :
                                    "text-orange-700 dark:text-orange-300 mr-1"
                                  }`}>
                                    {getChangePrefix(change.type)}
                                  </span>
                                  <span className="inline-block break-words pr-12">{change.description}</span>
                                </p>
                                {/* Owner-only dropdown for feedback without fileId, top-right */}
                                {isFeedback && !isFileLinked && change.authorId && me?.id === change.authorId && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem onClick={async () => {
                                        const next = prompt('Bewerk titel/omschrijving', change.description);
                                        if (next && next.trim() && next.trim() !== change.description) {
                                          await updateFeedback.mutateAsync({ changeId: String(change.id), description: next.trim() });
                                        }
                                      }} asChild>
                                        <button type="button" className="w-full text-left flex items-center"><Pencil className="h-3.5 w-3.5 mr-2" />Bewerken</button>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={async () => {
                                        if (confirm('Weet je zeker dat je deze feedback wilt verwijderen?')) {
                                          await deleteFeedback.mutateAsync({ changeId: String(change.id) });
                                        }
                                      }} asChild>
                                        <button type="button" className="w-full text-left flex items-center"><Trash2 className="h-3.5 w-3.5 mr-2" />Verwijderen</button>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>

                              {change.filename && (
                                <div className="flex items-center gap-2 mt-1 p-2 bg-white/80 dark:bg-gray-800/80 rounded border border-muted overflow-hidden max-w-full">
                                  {getFileIcon(change.filename)}
                                  <span className="text-xs font-mono text-muted-foreground break-words">
                                    {change.filename}
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-1 sm:gap-2 mt-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-medium">{change.author}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(change.time, locale)}</span>
                                </div>
                                {isFeedback ? (
                                  isFileLinked ? (
                                    <FileCTAs fileId={change.fileId as string} commentAnchor={change.id} />
                                  ) : (
                                    <CommentButton changeId={change.id} />
                                  )
                                ) : (change.filename ? (
                                  // Treat as file add/update
                                  <FileCTAs fileId={change.fileId as string} />
                                ) : null)}
                              </div>
                            </div>
                          </div>
                          {isFeedback && !isFileLinked && (
                            <ChangeComments changeId={change.id} expanded={expandedComments.has(change.id)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}



