import { Database } from "@/types/database";

export type ProjectComment = Database["public"]["Tables"]["project_comments"]["Row"] & {
  profiles?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  // Extended properties that may not be in the current database schema
  parent_id?: string | null;
  activity_change_id?: string | null;
  edited?: boolean;
  resolved?: boolean;
  timestamp_ms?: number | null;
  updated_at?: string;
};

export type ListCommentsParams = {
  projectId: string;
  activityChangeId?: string;
  versionId?: string;
  fileId?: string;
  limit?: number;
  cursor?: string; // ISO created_at
  scope?: "general";
};

export async function countComments(params: Omit<ListCommentsParams, "limit" | "cursor">): Promise<number> {
  const { projectId, activityChangeId, versionId, fileId } = params;
  const contexts = [activityChangeId, versionId, fileId].filter(Boolean);
  if (contexts.length !== 1) {
    throw new Error("Provide exactly one context: activityChangeId, versionId or fileId");
  }
  const search = new URLSearchParams();
  if (activityChangeId) search.set("activityChangeId", activityChangeId);
  if (versionId) search.set("versionId", versionId);
  if (fileId) search.set("fileId", fileId);
  search.set("countOnly", "true");
  const res = await fetch(`/api/projects/${projectId}/comments?${search.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    return 0;
  }
  const data = await res.json();
  return typeof data?.count === "number" ? data.count : 0;
}

export async function listComments(params: ListCommentsParams): Promise<ProjectComment[]> {
  const { projectId, activityChangeId, versionId, fileId, limit, cursor } = params;
  const contexts = [activityChangeId, versionId, fileId].filter(Boolean);
  if (contexts.length !== 1) {
    throw new Error("Provide exactly one context: activityChangeId, versionId or fileId");
  }
  const search = new URLSearchParams();
  if (activityChangeId) search.set("activityChangeId", activityChangeId);
  if (versionId) search.set("versionId", versionId);
  if (fileId) search.set("fileId", fileId);
  if (typeof limit !== "undefined") search.set("limit", String(limit));
  if (typeof cursor !== "undefined") search.set("cursor", String(cursor));
  if (params.scope) search.set("scope", params.scope);
  const res = await fetch(`/api/projects/${projectId}/comments${search.size ? `?${search.toString()}` : ""}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    let message = "Failed to load comments";
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }
  
  return (await res.json()) as ProjectComment[];
}

export type CreateCommentInput = {
  projectId: string;
  comment: string;
  parentId?: string;
  activityChangeId?: string;
  versionId?: string;
  fileId?: string;
  timestampMs?: number;
};

export async function createComment(input: CreateCommentInput): Promise<ProjectComment> {
  const { projectId, ...body } = input;
  const res = await fetch(`/api/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    let message = "Failed to create comment";
    try {
      const bodyData = await res.json();
      if (bodyData?.error) message = bodyData.error as string;
    } catch {}
    throw new Error(message);
  }
  
  return (await res.json()) as ProjectComment;
}

export type UpdateCommentInput = {
  projectId: string;
  commentId: string;
  comment?: string;
  resolved?: boolean;
};

export async function updateComment(input: UpdateCommentInput): Promise<ProjectComment> {
  const { projectId, commentId, ...body } = input;
  const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    let message = "Failed to update comment";
    try {
      const bodyData = await res.json();
      if (bodyData?.error) message = bodyData.error as string;
    } catch {}
    throw new Error(message);
  }
  
  return (await res.json()) as ProjectComment;
}

export async function deleteComment(projectId: string, commentId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    let message = "Failed to delete comment";
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }
}


