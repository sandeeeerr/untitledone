"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Trash2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkStatusBadge, LinkStatus } from "@/components/atoms/link-status-badge";
import { formatTimeRemaining, getLinkStatus } from "@/lib/utils/share-links";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ShareLinkCardProps {
  id: string;
  url: string;
  creatorName: string;
  expiresAt: string;
  usedBy: string | null;
  usedAt: string | null;
  revoked: boolean;
  createdAt: string;
  onRevoke?: (id: string) => Promise<void>;
}

/**
 * Share Link Card
 * 
 * Displays a share link with:
 * - Creation date and expiration info
 * - Creator name
 * - Status badge
 * - Copy button (if active)
 * - Revoke button (if active)
 * 
 * @example
 * <ShareLinkCard
 *   id="uuid"
 *   url="https://app.com/share/token"
 *   creatorName="John Doe"
 *   expiresAt="2025-10-12T10:00:00Z"
 *   usedBy={null}
 *   usedAt={null}
 *   revoked={false}
 *   createdAt="2025-10-12T09:00:00Z"
 *   onRevoke={async (id) => { ... }}
 * />
 */
export function ShareLinkCard({
  id,
  url,
  creatorName,
  expiresAt,
  usedBy,
  usedAt,
  revoked,
  createdAt,
  onRevoke,
}: ShareLinkCardProps) {
  const t = useTranslations("share_links");
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const status: LinkStatus = getLinkStatus({ expires_at: expiresAt, used_by: usedBy, revoked });
  const isActive = status === "active";
  const timeRemaining = formatTimeRemaining(expiresAt);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast({
        title: t("copy_success"),
        description: t("copy_success_description"),
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: t("copy_error"),
        description: t("copy_error_description"),
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async () => {
    if (!onRevoke) return;

    setIsRevoking(true);
    try {
      await onRevoke(id);
      toast({
        title: t("revoke_success"),
        description: t("revoke_success_description"),
      });
      setShowRevokeDialog(false);
    } catch (error) {
      console.error("Failed to revoke:", error);
      toast({
        title: t("revoke_error"),
        description: t("revoke_error_description"),
        variant: "destructive",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Link info */}
            <div className="flex-1 space-y-2 min-w-0">
              {/* Status and expiration */}
              <div className="flex items-center gap-2 flex-wrap">
                <LinkStatusBadge status={status} />
                {status === "active" ? (
                  <span className="text-sm text-muted-foreground">
                    {t("expires_in")} {timeRemaining}
                  </span>
                ) : status === "expired" ? (
                  <span className="text-sm text-muted-foreground">
                    {t("link_expired")}
                  </span>
                ) : status === "used" ? (
                  <span className="text-sm text-muted-foreground">
                    {t("link_used")}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("link_revoked")}
                  </span>
                )}
              </div>

              {/* Creator and timestamps */}
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  {t("created_by")} <span className="font-medium">{creatorName}</span>
                </div>
                <div>
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </div>
                {usedAt && (
                  <div>
                    {t("used")}{" "}
                    {formatDistanceToNow(new Date(usedAt), { addSuffix: true })}
                  </div>
                )}
              </div>

              {/* URL (truncated) - only show if active */}
              {isActive && (
                <div className="text-xs font-mono text-muted-foreground truncate">
                  {url}
                </div>
              )}
            </div>

            {/* Actions */}
            {isActive && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      {t("copy_link")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevokeDialog(true)}
                  disabled={isRevoking}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("revoke_link")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revoke confirmation dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("revoke_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("revoke_confirm_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={isRevoking}>
              {isRevoking ? t("revoking") : t("revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

