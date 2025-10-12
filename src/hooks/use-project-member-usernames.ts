/**
 * Hook for fetching and caching project member usernames
 * Used for mention validation in comments
 */

import { useQuery } from "@tanstack/react-query";

export interface ProjectMemberSummary {
  id: string;
  username: string | null;
}

async function fetchProjectMembers(projectId: string): Promise<ProjectMemberSummary[]> {
  const res = await fetch(`/api/projects/${projectId}/members/autocomplete`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    console.error("Failed to fetch project members");
    return [];
  }

  return res.json();
}

export function useProjectMemberUsernames(projectId: string) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["project", projectId, "member-usernames"],
    queryFn: () => fetchProjectMembers(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(projectId),
  });

  // Create a Set of valid usernames (lowercase for case-insensitive comparison)
  const validUsernames = new Set(
    members
      .filter((m) => m.username)
      .map((m) => m.username!.toLowerCase())
  );

  return {
    validUsernames,
    isLoading,
    members,
  };
}

