import { cn } from "@/lib/utils";

interface NotificationDotProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Notification Dot
 * 
 * Small blue dot indicator for unread notifications
 * Pure visual component (atom)
 * 
 * @example
 * <NotificationDot />
 */
export function NotificationDot({ className }: NotificationDotProps) {
  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full bg-blue-500",
        className
      )}
      aria-label="Unread notification indicator"
    />
  );
}

