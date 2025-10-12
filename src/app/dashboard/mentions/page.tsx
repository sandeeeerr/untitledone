import { getTranslations } from "next-intl/server";
import { formatDistanceToNow } from "date-fns";
import LayoutSidebar from "@/components/organisms/layout-sidebar";
import { MentionsDashboard } from "@/components/organisms/mentions-dashboard";
import { getNotifications } from "@/lib/api/notifications";
import { NotificationItemProps } from "@/components/molecules/notification-item";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Mentions Dashboard Page (Server Component)
 * 
 * Displays all @mention notifications for the current user
 * Fetches data server-side for optimal performance
 */
export default async function MentionsDashboardPage() {
  const t = await getTranslations("mentions");

  let notifications: NotificationItemProps[] = [];
  let error: string | null = null;

  try {
    const data = await getNotifications({ filter: "all", limit: 50 });
    
    // Map to NotificationItemProps
    notifications = data
      .filter((n) => n.comment && n.project && n.commenter) // Only show complete notifications
      .map((n) => ({
        id: n.id,
        projectName: n.project!.name,
        projectId: n.project!.id,
        commentExcerpt: n.comment!.comment,
        commenterName: n.commenter!.display_name || n.commenter!.username || "Unknown",
        commenterAvatar: n.commenter!.avatar_url,
        commentId: n.comment!.id,
        fileId: n.comment!.file_id,
        versionId: n.comment!.version_id,
        timestampMs: n.comment!.timestamp_ms,
        timeAgo: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
        isRead: n.is_read,
      }));
  } catch (e) {
    console.error("Failed to fetch notifications:", e);
    error = "Failed to load notifications";
  }

  return (
    <LayoutSidebar title={t("dashboard_title")}>
      <div className="container max-w-4xl py-8">
        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <MentionsDashboard
            initialNotifications={notifications}
            initialFilter="unread"
          />
        )}
      </div>
    </LayoutSidebar>
  );
}

