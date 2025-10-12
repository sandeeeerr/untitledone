"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/atoms/empty-state";
import { NotificationItem, NotificationItemProps } from "@/components/molecules/notification-item";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type FilterType = "unread" | "all";

export interface MentionsDashboardProps {
  /** Initial notifications data */
  initialNotifications: NotificationItemProps[];
  /** Initial filter state */
  initialFilter?: FilterType;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Mentions Dashboard
 * 
 * Full dashboard for viewing and managing @mention notifications
 * Includes:
 * - Filter buttons (Unread/All)
 * - "Mark all as read" action
 * - Notification list
 * - Loading, empty, and error states
 * 
 * @example
 * <MentionsDashboard
 *   initialNotifications={notifications}
 *   initialFilter="unread"
 * />
 */
export function MentionsDashboard({
  initialNotifications,
  initialFilter = "unread",
  isLoading = false,
}: MentionsDashboardProps) {
  const t = useTranslations("mentions");
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Filter notifications client-side
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingAllRead(true);
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      toast({
        title: "Success",
        description: `Marked ${unreadCount} notification${unreadCount === 1 ? "" : "s"} as read`,
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard_title")}
            {unreadCount > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({unreadCount} unread)
              </span>
            )}
          </h1>
        </div>
        
        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            variant="outline"
            size="sm"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {t("mark_all_read")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          <BellOff className="h-4 w-4 mr-2" />
          {t("filter_unread")}
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
        
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          <Bell className="h-4 w-4 mr-2" />
          {t("filter_all")}
        </Button>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading state
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredNotifications.length === 0 ? (
          // Empty state
          <EmptyState
            icon={Bell}
            title={t("no_mentions")}
            description={
              filter === "unread"
                ? "You have no unread mentions"
                : "You have no mentions yet"
            }
          />
        ) : (
          // Notifications
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              {...notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}

