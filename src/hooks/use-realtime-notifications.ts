/**
 * Realtime Notifications Hook
 * 
 * Subscribes to notification changes via Supabase Realtime
 * Updates badge count and triggers callbacks for new mentions
 */

import { useEffect, useState, useCallback } from "react";
import createClient from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface UseRealtimeNotificationsOptions {
  /** User ID to subscribe to notifications for */
  userId: string;
  /** Callback when a new notification is created */
  onNotificationCreated?: (notification: unknown) => void;
  /** Callback when a notification is updated (e.g., marked as read) */
  onNotificationUpdated?: (notification: unknown) => void;
  /** Callback when a notification is deleted */
  onNotificationDeleted?: (notification: unknown) => void;
  /** Enable/disable the subscription */
  enabled?: boolean;
}

/**
 * Hook for subscribing to realtime notification updates
 * 
 * Subscribes to postgres_changes events on the notifications table
 * Maintains unread count and triggers callbacks for UI updates
 * 
 * @example
 * const { unreadCount, refetch } = useRealtimeNotifications({
 *   userId: currentUser.id,
 *   onNotificationCreated: (notif) => {
 *     toast({ title: "New mention!" });
 *   },
 * });
 */
export function useRealtimeNotifications({
  userId,
  onNotificationCreated,
  onNotificationUpdated,
  onNotificationDeleted,
  enabled = true,
}: UseRealtimeNotificationsOptions) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [supabase] = useState(() => createClient());

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error("Failed to fetch unread count:", error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [userId, supabase]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Fetch initial count
      await fetchUnreadCount();

      // Subscribe to changes
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // New notification created
            const notification = payload.new;
            
            // Increment unread count if notification is unread
            if (notification && typeof notification === 'object' && 'is_read' in notification) {
              if (!notification.is_read) {
                setUnreadCount((prev) => prev + 1);
              }
            }

            // Trigger callback
            onNotificationCreated?.(notification);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // Notification updated (likely marked as read/unread)
            const oldNotif = payload.old;
            const newNotif = payload.new;

            if (
              oldNotif &&
              newNotif &&
              typeof oldNotif === 'object' &&
              typeof newNotif === 'object' &&
              'is_read' in oldNotif &&
              'is_read' in newNotif
            ) {
              const wasUnread = !oldNotif.is_read;
              const isUnread = !newNotif.is_read;

              // Update count based on read status change
              if (wasUnread && !isUnread) {
                // Marked as read
                setUnreadCount((prev) => Math.max(0, prev - 1));
              } else if (!wasUnread && isUnread) {
                // Marked as unread
                setUnreadCount((prev) => prev + 1);
              }
            }

            // Trigger callback
            onNotificationUpdated?.(newNotif);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // Notification deleted
            const oldNotif = payload.old;

            // Decrement count if deleted notification was unread
            if (oldNotif && typeof oldNotif === 'object' && 'is_read' in oldNotif) {
              if (!oldNotif.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }

            // Trigger callback
            onNotificationDeleted?.(oldNotif);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsConnected(false);
          }
        });
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [userId, enabled, onNotificationCreated, onNotificationUpdated, onNotificationDeleted, supabase, fetchUnreadCount]);

  // Handle reconnection - refetch count when connection is restored
  useEffect(() => {
    if (isConnected) {
      fetchUnreadCount();
    }
  }, [isConnected, fetchUnreadCount]);

  return {
    unreadCount,
    isConnected,
    refetch: fetchUnreadCount,
  };
}

