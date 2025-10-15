'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AtSign, Bell, CheckCheck, Loader2, X as _X, MessageSquare } from 'lucide-react';
import { HighlightedText } from '@/lib/utils/highlight-mentions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/atoms/empty-state';
import { NotificationItem as _NotificationItem } from '@/components/molecules/notification-item';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type FilterType = 'unread' | 'all';

interface NotificationsSheetProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Notification {
  id: string;
  type: string;
  comment_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
  project_comments?: {
    id: string;
    comment: string;
    user_id: string;
    project_id: string;
    file_id: string | null;
    version_id: string | null;
    timestamp_ms: number | null;
  }[];
  projects?: {
    id: string;
    name: string;
  }[];
  commenter?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function NotificationsSheet({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: NotificationsSheetProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('unread');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        limit: '50',
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: t('common.error'),
        description: t('notifications.error_loading'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast, t]);

  // Fetch notifications when sheet opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, filter, fetchNotifications]);

  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: t('common.error'),
        description: t('notifications.error_mark_read'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingAllRead(true);
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      toast({
        title: t('common.success'),
        description: t('notifications.all_marked_read'),
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast({
        title: t('common.error'),
        description: t('notifications.error_mark_all_read'),
        variant: 'destructive',
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to the project with comment highlighted
    const projectId = notification.project_id || notification.projects?.[0]?.id;
    const commentId = notification.comment_id || notification.project_comments?.[0]?.id;
    
    if (projectId && commentId) {
      router.push(
        `/projects/${projectId}?comment=${commentId}&highlight=true`
      );
      setOpen(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return t('common.just_now');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-lg">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span>{t('navigation.notifications')}</span>
            </SheetTitle>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                {unreadCount} {t('notifications.new')}
              </Badge>
            )}
          </div>
          <SheetDescription className="text-sm">{t('notifications.description')}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Filter Tabs and Actions */}
          <div className="flex items-center justify-between gap-3">
            <Tabs value={filter} onValueChange={v => setFilter(v as FilterType)} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unread" className="gap-2">
                  <Bell className="h-3.5 w-3.5" />
                  {t('notifications.unread')}
                  {unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-2">
                  {t('notifications.all')}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="shrink-0"
                title={t('notifications.mark_all_read')}
              >
                {isMarkingAllRead ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-240px)] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2 rounded-lg border bg-card p-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-12 w-12 text-muted-foreground/50" />}
                title={filter === 'unread' ? t('notifications.no_unread') : t('notifications.no_notifications')}
                description={
                  filter === 'unread'
                    ? t('notifications.no_unread_description')
                    : t('notifications.no_notifications_description')
                }
                className="py-12"
              />
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="group relative cursor-pointer space-y-3 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent/10 hover:shadow-sm"
                  >
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r-sm" />
                    )}

                    {/* Content */}
                    <div className="flex items-start justify-between pl-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        {/* Project name and time */}
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <p className="truncate text-sm font-medium text-muted-foreground">
                            {notification.projects?.[0]?.name || 'Unknown Project'}
                          </p>
                          <span className="ml-auto text-xs text-muted-foreground/60">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>

                        {/* Commenter */}
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
                            {(notification.commenter?.display_name || notification.commenter?.username || 'U')[0].toUpperCase()}
                          </div>
                          <p className="text-sm font-medium">
                            {notification.commenter?.display_name || notification.commenter?.username || 'Unknown User'}
                          </p>
                        </div>

                        {/* Comment with highlighted mentions */}
                        <div className="rounded-md bg-muted/30 p-3">
                          <p className="text-sm leading-relaxed">
                            <HighlightedText
                              text={notification.project_comments?.[0]?.comment || ''}
                              mentionClassName="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1 py-0.5 rounded"
                            />
                          </p>
                        </div>
                      </div>

                      {/* Mark as read button */}
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
                          onClick={e => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          title={t('notifications.mark_as_read')}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
