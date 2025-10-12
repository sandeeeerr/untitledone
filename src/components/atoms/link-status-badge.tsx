import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LinkStatus = "active" | "expired" | "used" | "revoked";

interface LinkStatusBadgeProps {
  status: LinkStatus;
  className?: string;
}

/**
 * Link Status Badge
 * 
 * Displays the status of a share link with appropriate color coding:
 * - Active: Green
 * - Expired: Gray
 * - Used: Gray
 * - Revoked: Red
 * 
 * @example
 * <LinkStatusBadge status="active" />
 */
export function LinkStatusBadge({ status, className }: LinkStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        };
      case "expired":
        return {
          label: "Expired",
          className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        };
      case "used":
        return {
          label: "Used",
          className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        };
      case "revoked":
        return {
          label: "Revoked",
          className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant="secondary"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

