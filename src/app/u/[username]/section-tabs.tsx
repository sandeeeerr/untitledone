"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ProfileTab = "overview" | "projects" | "comments";

export function ProfileSectionTabs({
  initialTab = "overview",
  onChange,
}: {
  initialTab?: ProfileTab;
  onChange?: (tab: ProfileTab) => void;
}) {
  const [active, setActive] = useState<ProfileTab>(initialTab);

  const select = (tab: ProfileTab) => {
    setActive(tab);
    onChange?.(tab);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Button
        size="sm"
        variant={active === "overview" ? "secondary" : "outline"}
        onClick={() => select("overview")}
      >
        Overview
      </Button>
      <Button
        size="sm"
        variant={active === "projects" ? "secondary" : "outline"}
        onClick={() => select("projects")}
      >
        Projects
      </Button>
      <Button
        size="sm"
        variant={active === "comments" ? "secondary" : "outline"}
        onClick={() => select("comments")}
      >
        Comments
      </Button>
    </div>
  );
} 