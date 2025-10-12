"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDot } from "@/components/atoms/notification-dot";
import UserAvatar from "@/components/atoms/user-avatar";

export interface NotificationItemProps {
  id: string;
  projectName: string;
  projectId: string;
  commentExcerpt: string;
  commenterName: string;
  commenterAvatar?: string | null;
  commentId: string;
  fileId?: string | null;
  versionId?: string | null;
  timestampMs?: number | null;
  timeAgo: string;
  isRead: boolean;
  onMarkAsRead?: (id: string) => void;
}

/**
 * Notification Item
 * 
 * Displays a single notification entry with:
 * - Project name
 * - Comment excerpt (100 chars)
 * - Commenter name with avatar
 * - Time ago
 * - Read/unread indicator
 * - Context label (file/version/timestamp)
 * 
 * @example
 * <NotificationItem
 *   id="uuid"
 *   projectName="My Track"
 *   projectId="uuid"
 *   commentExcerpt="Hey @john, can you check this?"
 *   commenterName="Sarah"
 *   commentId="uuid"
 *   timeAgo="2 hours ago"
 *   isRead={false}
 * />
 */
export function NotificationItem({
  id,
  projectName,
  projectId,
  commentExcerpt,
  commenterName,
  commenterAvatar,
  commentId,
  fileId,
  versionId,
  timestampMs,
  timeAgo,
  isRead,
  onMarkAsRead,
}: NotificationItemProps) {
  // Build deep link URL with context
  const buildLinkUrl = () => {
    const params = new URLSearchParams({
      comment: commentId,
      highlight: "true",
    });
    
    if (fileId) {
      params.set("file", fileId);
    }
    if (versionId) {
      params.set("version", versionId);
    }
    if (timestampMs) {
      params.set("t", Math.floor(timestampMs / 1000).toString());
    }
    
    return `/projects/${projectId}?${params.toString()}`;
  };

  // Build context label
  const getContextLabel = () => {
    const parts: string[] = [];
    
    if (fileId) {
      parts.push("File comment");
    }
    if (versionId) {
      parts.push("Version comment");
    }
    if (timestampMs) {
      const seconds = Math.floor(timestampMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      parts.push(`at ${minutes}:${secs.toString().padStart(2, "0")}`);
    }
    
    return parts.length > 0 ? parts.join(" ") : "Comment";
  };

  const handleClick = () => {
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <Link
      href={buildLinkUrl()}
      onClick={handleClick}
      className={cn(
        "block rounded-lg border p-4 transition-colors hover:bg-accent/50",
        !isRead && "bg-blue-50/50 dark:bg-blue-950/10"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        {!isRead && (
          <div className="pt-1.5">
            <NotificationDot />
          </div>
        )}
        
        {/* Avatar */}
        <UserAvatar
          name={commenterName}
          avatarUrl={commenterAvatar}
          size="sm"
          className="mt-0.5"
        />
        
        {/* Content */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Header: Commenter and project */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{commenterName}</span>
            <span className="text-muted-foreground">mentioned you in</span>
            <span className="font-medium text-foreground truncate">{projectName}</span>
          </div>
          
          {/* Comment excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            <MessageSquare className="inline h-3.5 w-3.5 mr-1.5" />
            {commentExcerpt.length > 100
              ? `${commentExcerpt.slice(0, 100)}...`
              : commentExcerpt}
          </p>
          
          {/* Footer: Context and time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{getContextLabel()}</span>
            <span>•</span>
            <time dateTime={timeAgo}>{timeAgo}</time>
          </div>
        </div>
      </div>
    </Link>
  );
}

