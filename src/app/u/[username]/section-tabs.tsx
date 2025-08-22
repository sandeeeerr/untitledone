"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Tabs value={active} onValueChange={(v: string) => select(v as ProfileTab)} className="w-full gap-4">
      <div className="mt-2 md:mt-4 flex items-center justify-between border-b">
        <TabsList className="bg-background relative rounded-none border-b-0 p-0 w-auto">
          <TabsTrigger
            value="overview"
            className="relative -mb-[2px] border-b-2 border-transparent data-[state=active]:border-primary px-3 sm:px-4"
          >
            <span className="text-sm">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="bg-background dark:data-[state=active]:bg-background relative z-10 rounded-none data-[state=active]:shadow-none px-3 sm:px-4 -mb-[2px] border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <span className="text-sm">Projects</span>
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="bg-background dark:data-[state=active]:bg-background relative z-10 rounded-none data-[state=active]:shadow-none px-3 sm:px-4 -mb-[2px] border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <span className="text-sm">Comments</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
} 