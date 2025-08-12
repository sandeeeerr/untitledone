"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProfile } from "@/lib/api/queries";

export function ProfileActions({ viewedUsername }: { viewedUsername: string }) {
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const { data: myProfile } = useProfile();
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwner = useMemo(() => {
    if (!user || !myProfile) return false;
    return myProfile.username === viewedUsername;
  }, [user, myProfile, viewedUsername]);

  if (isOwner) return null;

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
    toast({
      title: isFollowing ? "Unfollowed" : "Followed",
      description: isFollowing
        ? `You stopped following @${viewedUsername}.`
        : `You are now following @${viewedUsername}.`,
    });
  };

  const handleMessage = () => {
    toast({
      title: "Message",
      description: "Messaging will be available soon.",
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleFollowToggle}>
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      <Button variant="outline" onClick={handleMessage}>
        Message
      </Button>
    </div>
  );
} 