"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/atoms/empty-state";
import { ShareLinkCard } from "@/components/molecules/share-link-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export interface ShareLink {
  id: string;
  url: string;
  token: string;
  created_by: string;
  creator_name: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  revoked: boolean;
  created_at: string;
}

export interface ShareLinksManagerProps {
  projectId: string;
  initialLinks: ShareLink[];
  isLoading?: boolean;
}

/**
 * Share Links Manager
 * 
 * Manages project share links:
 * - Display list of all links (active, expired, used, revoked)
 * - Generate new links (up to 3 active)
 * - Revoke active links
 * - Copy link to clipboard
 * 
 * @example
 * <ShareLinksManager
 *   projectId="uuid"
 *   initialLinks={links}
 * />
 */
export function ShareLinksManager({
  projectId,
  initialLinks,
  isLoading = false,
}: ShareLinksManagerProps) {
  const t = useTranslations("share_links");
  const { toast } = useToast();
  const [links, setLinks] = useState<ShareLink[]>(initialLinks);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState<string>("");

  // Count active links
  const activeCount = links.filter((link) => {
    const now = Date.now();
    const expiresAt = new Date(link.expires_at).getTime();
    return !link.revoked && !link.used_by && expiresAt > now;
  }).length;

  const canGenerateMore = activeCount < 3;

  // Generate new link
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/share-links`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate link");
      }

      const newLink = await response.json();

      // Refetch all links to get complete data
      const listResponse = await fetch(`/api/projects/${projectId}/share-links`);
      if (listResponse.ok) {
        const updatedLinks = await listResponse.json();
        setLinks(updatedLinks);
      }

      setNewLinkUrl(newLink.url);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to generate link:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate link";
      toast({
        title: t("generate_error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Revoke link
  const handleRevoke = async (linkId: string) => {
    const response = await fetch(`/api/projects/${projectId}/share-links/${linkId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to revoke link");
    }

    // Update local state
    setLinks((prev) =>
      prev.map((link) =>
        link.id === linkId ? { ...link, revoked: true } : link
      )
    );
  };

  // Copy new link to clipboard
  const handleCopyNewLink = async () => {
    try {
      await navigator.clipboard.writeText(newLinkUrl);
      toast({
        title: t("copy_success"),
        description: t("copy_success_description"),
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with generate button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("description")} ({activeCount}/3 {t("active_links")})
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerateMore || isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {t("generate_link")}
              </>
            )}
          </Button>
        </div>

        {/* Max limit warning */}
        {!canGenerateMore && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t("max_links_reached")}
            </p>
          </div>
        )}

        {/* Links list */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : links.length === 0 ? (
            <EmptyState
              icon={LinkIcon}
              title={t("no_links")}
              description={t("no_links_description")}
            />
          ) : (
            links.map((link) => (
              <ShareLinkCard
                key={link.id}
                id={link.id}
                url={link.url}
                creatorName={link.creator_name}
                expiresAt={link.expires_at}
                usedBy={link.used_by}
                usedAt={link.used_at}
                revoked={link.revoked}
                createdAt={link.created_at}
                onRevoke={handleRevoke}
              />
            ))
          )}
        </div>
      </div>

      {/* Success dialog for new link */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("link_generated")}</DialogTitle>
            <DialogDescription>
              {t("link_generated_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted p-3">
              <p className="text-sm font-mono break-all">{newLinkUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopyNewLink} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                {t("copy_link")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
              >
                {t("close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

