"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colorFromString, cn } from "@/lib/utils";

export interface UserAvatarProps {
  name?: string | null;
  username?: string | null;
  userId?: string | null;
  src?: string | null;
  className?: string;
  size?: number; // tailwind rem base sizes handled via className typically
}

export function UserAvatar({ name, username, userId, src, className }: UserAvatarProps) {
  const display = (name || username || "").trim();
  const initial = (display || "U").charAt(0).toUpperCase();
  const key = username || userId || name || "unknown";
  const bg = colorFromString(key);

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={src || undefined} alt={display || "User"} />
      <AvatarFallback
        className="flex items-center justify-center leading-none"
        style={{ backgroundColor: bg, color: "white" }}
      >
        <span className="font-medium">
          {initial}
        </span>
      </AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;


