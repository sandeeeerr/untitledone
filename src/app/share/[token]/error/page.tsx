import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AlertCircle, Clock, XCircle, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "nodejs";

interface ShareLinkErrorPageProps {
  searchParams: Promise<{ reason?: string }>;
}

/**
 * Share Link Error Page
 * 
 * Displays different error messages based on the reason:
 * - expired: Link has passed 1-hour expiration
 * - used: Link was already redeemed by another user
 * - revoked: Link was revoked by creator or owner
 * - not_found: Link doesn't exist
 * - project_not_found: Associated project was deleted
 * - failed_to_add_member: Technical error adding user as viewer
 */
export default async function ShareLinkErrorPage({ searchParams }: ShareLinkErrorPageProps) {
  const t = await getTranslations("share_links.errors");
  const { reason } = await searchParams;

  const getErrorConfig = () => {
    switch (reason) {
      case "expired":
        return {
          icon: Clock,
          title: t("expired_title"),
          description: t("expired_description"),
          iconColor: "text-yellow-500",
        };
      case "used":
        return {
          icon: XCircle,
          title: t("used_title"),
          description: t("used_description"),
          iconColor: "text-gray-500",
        };
      case "revoked":
        return {
          icon: XCircle,
          title: t("revoked_title"),
          description: t("revoked_description"),
          iconColor: "text-red-500",
        };
      case "not_found":
        return {
          icon: FileX,
          title: t("not_found_title"),
          description: t("not_found_description"),
          iconColor: "text-gray-500",
        };
      case "project_not_found":
        return {
          icon: FileX,
          title: t("project_not_found_title"),
          description: t("project_not_found_description"),
          iconColor: "text-gray-500",
        };
      case "failed_to_add_member":
        return {
          icon: AlertCircle,
          title: t("failed_title"),
          description: t("failed_description"),
          iconColor: "text-red-500",
        };
      default:
        return {
          icon: AlertCircle,
          title: t("unknown_title"),
          description: t("unknown_description"),
          iconColor: "text-gray-500",
        };
    }
  };

  const errorConfig = getErrorConfig();
  const Icon = errorConfig.icon;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`rounded-full p-4 bg-muted`}>
              <Icon className={`h-12 w-12 ${errorConfig.iconColor}`} />
            </div>
            <CardTitle className="text-2xl">{errorConfig.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {errorConfig.description}
          </p>

          {/* Suggestions based on error type */}
          <div className="space-y-2">
            {reason === "expired" && (
              <p className="text-sm text-muted-foreground text-center">
                {t("expired_suggestion")}
              </p>
            )}
            {reason === "used" && (
              <p className="text-sm text-muted-foreground text-center">
                {t("used_suggestion")}
              </p>
            )}
            {reason === "revoked" && (
              <p className="text-sm text-muted-foreground text-center">
                {t("revoked_suggestion")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">{t("go_to_dashboard")}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/projects">{t("browse_projects")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

