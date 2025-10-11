"use client"

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProfile } from "@/lib/api/queries";
import { Pencil } from "lucide-react";
import Link from "next/link";

export function OwnerEditButton({ viewedUsername }: { viewedUsername: string }) {
  const { data: user } = useCurrentUser();
  const { data: myProfile } = useProfile();

  const isOwner = useMemo(() => {
    if (!user || !myProfile) return false;
    return myProfile.username === viewedUsername;
  }, [user, myProfile, viewedUsername]);

  if (!isOwner) return null;

  return (
    <Button size="sm" variant="outline" asChild>
      <Link href="/settings/profile">
        <Pencil className="h-4 w-4 mr-2" /> Edit profile
      </Link>
    </Button>
  );
} 