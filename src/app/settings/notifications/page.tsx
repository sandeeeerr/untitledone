"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NotificationSettings, NotificationPreferences } from "@/components/organisms/notification-settings";

export const runtime = "nodejs";

/**
 * Notification Settings Page
 * 
 * Allows users to configure their notification preferences:
 * - Email notifications for mentions (on/off)
 * - In-app notifications for mentions (on/off)
 * - Email frequency (instant vs daily digest)
 */
export default function NotificationSettingsPage() {
  const t = useTranslations("notifications");

  // Fetch current preferences
  const { data: preferences, isLoading, error } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage your notification preferences
          </p>
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !preferences) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage your notification preferences
          </p>
        </div>
        <Separator />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {t("load_error")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Manage your notification preferences
        </p>
      </div>
      <Separator />
      <NotificationSettings initialPreferences={preferences} />
    </div>
  );
}

