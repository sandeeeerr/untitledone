"use client";

import { useDeferredValue, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/atoms/user-avatar";
import EmptyState from "@/components/atoms/empty-state";
import ActivitySkeleton from "@/components/atoms/activity-skeleton";
import { useProjectActivity } from "@/lib/api/queries";
import CreateVersionDialog from "@/components/molecules/create-version-dialog";
import EditVersionDialog from "@/components/molecules/edit-version-dialog";
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

export interface ProjectActivityMicroChange {
  id: string;
  type: ProjectActivityChangeType;
  description: string;
  author: string;
  time: string; // HH:mm or relative
  avatar?: string | null;
  filename?: string; // optional file reference to preview
}

export interface ProjectActivityVersion {
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
  const { data: versions, isLoading, error, refetch } = useProjectActivity(projectId)
  const locale = useLocale()
  const deferredQuery = useDeferredValue(query ?? "")
  const t = useTranslations('activity')
  
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
                  <EditVersionDialog 
                    versionId={version.version}
                    currentName={version.version}
                    currentDescription={version.description}
                  />
                </div>
            </CardHeader>

                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3">
                    {version.microChanges.map((change) => {
                      const baseClasses = "flex items-start gap-3 p-3 rounded-lg transition-all border w-full max-w-full flex-col sm:flex-row";
                      const typeStyles = {
                        feedback: "bg-blue-50/30 border-blue-100 hover:bg-blue-50/50 hover:border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30 dark:hover:bg-blue-950/20",
                        addition: "bg-green-50/30 border-green-100 hover:bg-green-50/50 hover:border-green-200 dark:bg-green-950/10 dark:border-green-900/30 dark:hover:bg-green-950/20",
                        update: "bg-orange-50/30 border-orange-100 hover:bg-orange-50/50 hover:border-orange-200 dark:bg-orange-950/10 dark:border-orange-900/30 dark:hover:bg-orange-950/20"
                      };

                      return (
                        <button 
                          key={change.id} 
                          className={`${baseClasses} ${typeStyles[change.type] || typeStyles.update}`}
                          aria-label={`${change.type === 'feedback' ? 'Reply to feedback' : change.filename ? 'View file' : 'View details'}: ${change.description}`}
                        >
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

                          <div className="flex-1 min-w-0 w-full text-left">
                            <p className={`text-sm break-words ${change.type === "feedback" ? "italic text-blue-700 dark:text-blue-300" : ""}`}>
                              <span className={`font-medium mr-1 ${
                                change.type === "addition" ? "text-green-700 dark:text-green-300" :
                                change.type === "feedback" ? "text-blue-700 dark:text-blue-300" :
                                "text-orange-700 dark:text-orange-300"
                              }`}>
                                {getChangePrefix(change.type)}
                              </span>
                              {change.description}
                            </p>

                            {change.filename && (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded border border-muted overflow-hidden max-w-full">
                                {getFileIcon(change.filename)}
                                <span className="text-xs font-mono text-muted-foreground break-words">
                                  {change.filename}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-1 sm:gap-2 mt-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium">{change.author}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(change.time, locale)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
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


