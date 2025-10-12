"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { UserPlus, Check, X, Clock, ExternalLink as _ExternalLink } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/atoms/user-avatar";
import EmptyState from "@/components/atoms/empty-state";
import { usePendingInvitations, type PendingInvitation } from "@/lib/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface InvitationsSheetProps {
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export default function InvitationsSheet({
	trigger,
	open: controlledOpen,
	onOpenChange,
}: InvitationsSheetProps) {
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const { data: invitations = [], isLoading } = usePendingInvitations();

	const open = controlledOpen ?? uncontrolledOpen;
	const setOpen = onOpenChange ?? setUncontrolledOpen;

	const handleAccept = async (invitation: PendingInvitation) => {
		try {
			const res = await fetch(
				`/api/invitations/${invitation.id}/accept`,
				{
					method: "POST",
				},
			);

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to accept invitation");
			}

			// Refresh invitations list and projects
			await queryClient.invalidateQueries({ queryKey: ["invitations", "pending"] });
			await queryClient.invalidateQueries({ queryKey: ["projects"] });
			await queryClient.invalidateQueries({ queryKey: ["projects", "list"] });

			toast({
				title: t("invitations.accepted"),
				description: `${t("invitations.youJoined")} ${invitation.projects.name}`,
			});

			// Navigate to the project after short delay
			setTimeout(() => {
				router.push(`/projects/${invitation.project_id}`);
				setOpen(false);
			}, 500);
		} catch (error) {
			console.error("Failed to accept invitation:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to accept invitation";
			toast({
				variant: "destructive",
				title: t("common.error"),
				description: errorMessage,
			});
		}
	};

	const handleDecline = async (_invitationId: string) => {
		// For now, we can delete by accepting with a decline endpoint (future implementation)
		// Or simply ignore it and let it expire
		toast({
			title: t("invitations.declined"),
			description: t("invitations.invitationIgnored"),
		});
		// Could implement DELETE endpoint later
	};

	const formatTimeLeft = (expiresAt: string) => {
		const now = new Date();
		const expires = new Date(expiresAt);
		const diffMs = expires.getTime() - now.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffDays > 1) {
			return `${diffDays} ${locale === "nl" ? "dagen" : "days"}`;
		}
		if (diffHours > 1) {
			return `${diffHours} ${locale === "nl" ? "uur" : "hours"}`;
		}
		return locale === "nl" ? "< 1 uur" : "< 1 hour";
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>{trigger}</SheetTrigger>

			<SheetContent side="right" className="w-full sm:w-[420px] sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<UserPlus className="h-5 w-5" />
						{t("navigation.invitations")}
						{invitations.length > 0 && (
							<Badge variant="secondary" className="ml-auto">
								{invitations.length}
							</Badge>
						)}
					</SheetTitle>
					<SheetDescription>
						{t("invitations.description")}
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className="h-[calc(100vh-160px)] mt-8 pr-4">
					{isLoading ? (
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="border rounded-lg p-4 space-y-3 bg-card"
								>
									<div className="flex items-start gap-3">
										<div className="flex-1 space-y-2">
											<Skeleton className="h-5 w-3/4" />
											<Skeleton className="h-4 w-1/2" />
										</div>
										<Skeleton className="h-10 w-10 rounded-full" />
									</div>
									<div className="flex gap-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-24" />
									</div>
									<div className="flex gap-2">
										<Skeleton className="h-9 flex-1" />
										<Skeleton className="h-9 w-9" />
									</div>
								</div>
							))}
						</div>
					) : invitations.length === 0 ? (
						<EmptyState
							icon={<UserPlus className="h-12 w-12" />}
							title={t("invitations.noInvitations")}
							description={t("invitations.noInvitationsDescription")}
						/>
					) : (
						<div className="space-y-3">
							{invitations.map((inv) => {
								const project = inv.projects;
								const inviter = project?.profiles;

								return (
									<div
										key={inv.id}
										className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
									>
										{/* Project Info */}
										<div className="flex items-start gap-3">
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold truncate text-base">
													{project.name}
												</h4>
												<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
													<span className="truncate">
														{locale === "nl" ? "Van" : "From"}{" "}
														{inviter?.display_name ||
															inviter?.username ||
															"Unknown"}
													</span>
												</div>
												{project.description && (
													<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
														{project.description}
													</p>
												)}
											</div>
											<UserAvatar
												name={inviter?.display_name || inviter?.username}
												username={inviter?.username}
												userId={inviter?.id}
												src={inviter?.avatar_url}
												className="h-10 w-10 shrink-0"
											/>
										</div>

										{/* Role & Expiry */}
										<div className="flex items-center gap-2 text-xs flex-wrap">
											<Badge variant="secondary" className="capitalize">
												{inv.role}
											</Badge>
											{project.genre && (
												<Badge variant="outline" className="capitalize">
													{project.genre}
												</Badge>
											)}
											<span className="text-muted-foreground flex items-center gap-1 ml-auto">
												<Clock className="h-3 w-3" />
												{locale === "nl" ? "Verloopt over" : "Expires in"}{" "}
												{formatTimeLeft(inv.expires_at)}
											</span>
										</div>

										{/* Actions */}
										<div className="flex gap-2">
											<Button
												size="sm"
												className="flex-1"
												onClick={() => handleAccept(inv)}
											>
												<Check className="h-4 w-4 mr-1" />
												{t("invitations.accept")}
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleDecline(inv.id)}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

