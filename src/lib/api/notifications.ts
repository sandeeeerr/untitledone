/**
 * Notifications API Functions
 * 
 * Functions for fetching and managing user notifications
 */

import createServerClient from "@/lib/supabase/server";
import { Database } from "@/types/database";

export type NotificationType = "mention" | "comment" | "invitation";

export interface NotificationWithContext {
  id: string;
  user_id: string;
  type: NotificationType;
  comment_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  comment?: {
    id: string;
    comment: string;
    user_id: string;
    project_id: string;
    file_id: string | null;
    version_id: string | null;
    timestamp_ms: number | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  commenter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface GetNotificationsOptions {
  /** Filter by read/unread status */
  filter?: "unread" | "all";
  /** Maximum number of notifications to return */
  limit?: number;
  /** Pagination cursor (ISO timestamp) */
  cursor?: string;
}

/**
 * Get notifications for the current user
 * Server-side only function that requires authentication
 * 
 * @param options - Filter and pagination options
 * @returns Array of notifications with full context
 */
export async function getNotifications(
  options: GetNotificationsOptions = {}
): Promise<NotificationWithContext[]> {
  const { filter = "all", limit = 20, cursor } = options;
  
  const supabase = await createServerClient();
  
  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Build query
  let query = supabase
    .from("notifications")
    .select(`
      id,
      user_id,
      type,
      comment_id,
      project_id,
      is_read,
      created_at,
      updated_at,
      project_comments!notifications_comment_id_fkey (
        id,
        comment,
        user_id,
        project_id,
        file_id,
        version_id,
        timestamp_ms
      ),
      projects!notifications_project_id_fkey (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Apply filter
  if (filter === "unread") {
    query = query.eq("is_read", false);
  }

  // Apply cursor for pagination
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch notifications:", error);
    throw new Error("Failed to fetch notifications");
  }

  // Fetch commenter profiles separately (can't do nested join through comment)
  const notifications = data || [];
  const commenterIds = notifications
    .map((n) => n.project_comments?.user_id)
    .filter((id): id is string => !!id);

  let commentersMap = new Map<string, {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }>();

  if (commenterIds.length > 0) {
    const { data: commenters } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", commenterIds);

    if (commenters) {
      commenters.forEach((commenter) => {
        commentersMap.set(commenter.id, commenter);
      });
    }
  }

  // Map to NotificationWithContext
  return notifications.map((n) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type as NotificationType,
    comment_id: n.comment_id,
    project_id: n.project_id,
    is_read: n.is_read,
    created_at: n.created_at,
    updated_at: n.updated_at,
    comment: n.project_comments || null,
    project: n.projects || null,
    commenter: n.project_comments?.user_id 
      ? commentersMap.get(n.project_comments.user_id) || null
      : null,
  }));
}

/**
 * Get unread notification count for the current user
 * Server-side only function that requires authentication
 * 
 * @returns Number of unread notifications
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createServerClient();
  
  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to fetch unread count:", error);
    return 0;
  }

  return count || 0;
}

