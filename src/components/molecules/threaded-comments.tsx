"use client";

import React, { useTransition, useOptimistic, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/atoms/user-avatar";
import { useCreateProjectComment, useUpdateProjectComment, useDeleteProjectComment, useProfile } from "@/lib/api/queries";
import { type ProjectComment } from "@/lib/api/comments";
import { buildCommentTree, type CommentTreeNode } from "@/lib/utils/comments";
import { CornerUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CommentMentionInput } from "@/components/molecules/comment-mention-input";
import { HighlightedText } from "@/lib/utils/highlight-mentions";
import createClient from "@/lib/supabase/client";
import { useProjectMemberUsernames } from "@/hooks/use-project-member-usernames";

export interface ThreadedCommentsProps {
  projectId: string;
  context: { activityChangeId?: string; versionId?: string; fileId?: string };
  comments: ProjectComment[];
  isLoading?: boolean;
  getTimestampMs?: () => number | null;
  onSeekToTimestamp?: (ms: number) => void;
  highlightedCommentId?: string | null;
}

export default function ThreadedComments({ 
  projectId, 
  context, 
  comments: initialComments, 
  isLoading, 
  getTimestampMs, 
  onSeekToTimestamp, 
  highlightedCommentId
}: ThreadedCommentsProps) {
  const t = useTranslations("comments");
  const create = useCreateProjectComment();
  const { data: currentProfile } = useProfile();
  const { validUsernames } = useProjectMemberUsernames(projectId);
  
  // Local state with realtime updates
  const [comments, setComments] = React.useState(initialComments);
  const [newComment, setNewComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Optimistic updates for instant UI feedback
  const [optimisticComments, addOptimisticComment] = useOptimistic<ProjectComment[], ProjectComment>(
    comments,
    (state, newComment) => [newComment, ...state]
  );

  // Sync initialComments with local state
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    const supabase = createClient();
    
    const contextFilter = 
      context.activityChangeId ? `activity_change_id=eq.${context.activityChangeId}` :
      context.versionId ? `version_id=eq.${context.versionId}` :
      context.fileId ? `file_id=eq.${context.fileId}` : null;

    if (!contextFilter) return;

    const channel = supabase
      .channel(`project-comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_comments',
          filter: contextFilter,
        },
        (payload) => {
          const newComment = payload.new as ProjectComment;
          // Only add if not from current user (optimistic update already added it)
          if (newComment.user_id !== currentProfile?.id) {
            setComments((prev) => [newComment, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_comments',
          filter: contextFilter,
        },
        (payload) => {
          const updated = payload.new as ProjectComment;
          setComments((prev) => 
            prev.map((c) => (String(c.id) === String(updated.id) ? updated : c))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'project_comments',
          filter: contextFilter,
        },
        (payload) => {
          const deleted = payload.old as Pick<ProjectComment, 'id'>;
          setComments((prev) => prev.filter((c) => String(c.id) !== String(deleted.id)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, context, currentProfile?.id]);

  // Memoized comment tree
  const tree = useMemo<CommentTreeNode[]>(
    () => buildCommentTree(optimisticComments || []), 
    [optimisticComments]
  );

  // Submit handler with proper error handling and state management
  const handlePost = useCallback(async () => {
    const text = newComment.trim();
    
    // Validation
    if (!text) {
      setError(t("emptyComment", { defaultValue: "Comment cannot be empty" }));
      return;
    }

    // Clear error and input immediately for instant feedback
    setError(null);
    setNewComment(""); // Clear input immediately
    
    // Optimistic update
    startTransition(() => {
      if (!currentProfile) return;

      const optimistic: ProjectComment = {
        id: `optimistic-${Date.now()}` as unknown as ProjectComment["id"],
        project_id: projectId,
        parent_id: null,
        activity_change_id: context.activityChangeId ?? null,
        version_id: context.versionId ?? null,
        file_id: context.fileId ?? null,
        user_id: currentProfile.id as unknown as ProjectComment["user_id"],
        comment: text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        edited: false,
        resolved: false,
        timestamp_ms: getTimestampMs ? getTimestampMs() : null,
        profiles: {
          id: currentProfile.id,
          display_name: currentProfile.display_name,
          username: currentProfile.username,
          avatar_url: currentProfile.avatar_url,
        },
      } as ProjectComment;

      addOptimisticComment(optimistic);
    });

    // Actual mutation
    try {
      const ts = getTimestampMs ? getTimestampMs() : null;
      const created = await create.mutateAsync({ 
        projectId, 
        comment: text, 
        ...(ts !== null ? { timestampMs: ts } : {}), 
        ...context 
      });
      
      // Update local state with server response (replace optimistic with real)
      setComments((prev) => [created, ...prev.filter(c => !String(c.id).startsWith('optimistic-'))]);
    } catch (err) {
      // On error: remove optimistic update and restore the input text
      setComments((prev) => prev.filter(c => !String(c.id).startsWith('optimistic-')));
      setNewComment(text); // Restore text on error
      setError(err instanceof Error ? err.message : t("failedToPost", { defaultValue: "Failed to post comment" }));
    }
  }, [newComment, projectId, context, getTimestampMs, currentProfile, create, t, addOptimisticComment]);

  const toggleResolved = useCallback(async (c: ProjectComment) => {
    // Optimistic update
    setComments((prev) => 
      prev.map((comment) => 
        String(comment.id) === String(c.id) 
          ? { ...comment, resolved: !c.resolved } 
          : comment
      )
    );
  }, []);

  const handleReply = useCallback(async (parent: ProjectComment, text: string) => {
    try {
      const created = await create.mutateAsync({ 
        projectId, 
        comment: text, 
        parentId: String(parent.id), 
        ...context 
      });
      setComments((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToReply", { defaultValue: "Failed to reply" }));
    }
  }, [projectId, context, create, t]);

  return (
    <div className="w-full space-y-3">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : tree.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t("noCommentsYet")}</div>
      ) : (
        tree.map((node) => (
          <Thread 
            key={String(node.comment.id)} 
            node={node} 
            depth={0} 
            onReply={handleReply} 
            onToggleResolved={toggleResolved} 
            projectId={projectId} 
            onSeekToTimestamp={onSeekToTimestamp} 
            highlightedCommentId={highlightedCommentId ?? null}
            validMemberUsernames={validUsernames}
          />
        ))
      )}

      <div className="flex gap-2">
        <CommentMentionInput
          projectId={projectId}
          value={newComment}
          onChange={setNewComment}
          placeholder={t("addComment")}
          rows={2}
          disabled={isPending || create.isPending}
        />
        <Button 
          size="sm" 
          onClick={handlePost} 
          disabled={isPending || create.isPending || !newComment.trim()}
          className="self-end"
        >
          {(isPending || create.isPending) ? t("posting") : t("post")}
        </Button>
      </div>
      {error && <div className="text-xs text-red-600" role="alert">{error}</div>}
    </div>
  );
}

interface ThreadProps {
  node: CommentTreeNode;
  depth: number;
  onReply: (parent: ProjectComment, text: string) => Promise<void>;
  onToggleResolved: (c: ProjectComment) => Promise<void>;
  projectId: string;
  onSeekToTimestamp?: (ms: number) => void;
  highlightedCommentId: string | null;
  validMemberUsernames?: Set<string>;
}

function Thread({ 
  node, 
  depth, 
  onReply, 
  onToggleResolved, 
  projectId, 
  onSeekToTimestamp, 
  highlightedCommentId,
  validMemberUsernames
}: ThreadProps) {
  const t = useTranslations("comments");
  const update = useUpdateProjectComment();
  const del = useDeleteProjectComment(projectId);
  const [isReplying, setIsReplying] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(node.comment.comment);
  const [isPending, startTransition] = useTransition();
  
  const maxIndent = Math.min(depth, 6);
  const hasManyReplies = node.children.length > 3;
  const [showAllReplies, setShowAllReplies] = React.useState(!node.comment.resolved && !hasManyReplies);
  const isHighlighted = highlightedCommentId && String(node.comment.id) === highlightedCommentId;

  const formatMs = useCallback((ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(total / 60).toString().padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }, []);

  const commentRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted comment
  useEffect(() => {
    if (isHighlighted && commentRef.current) {
      const timer = setTimeout(() => {
        commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const handleSaveEdit = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === node.comment.comment) {
      setIsEditing(false);
      return;
    }
    
    startTransition(async () => {
      try {
        await update.mutateAsync({ 
          projectId, 
          commentId: String(node.comment.id), 
          comment: trimmed 
        });
        setIsEditing(false);
      } catch (err) {
        console.error("Failed to update comment:", err);
      }
    });
  }, [draft, node.comment.comment, node.comment.id, projectId, update]);

  const handleReplySubmit = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    
    // Clear input immediately for instant feedback
    const savedText = trimmed;
    setReplyText("");
    
    startTransition(async () => {
      try {
        await onReply(node.comment, savedText);
        setIsReplying(false);
      } catch (err) {
        // On error: restore the text
        setReplyText(savedText);
        console.error("Failed to reply:", err);
      }
    });
  }, [replyText, node.comment, onReply]);

  return (
    <div 
      ref={commentRef}
      data-comment-id={node.comment.id}
      role="treeitem" 
      aria-level={depth + 1} 
      aria-selected={isHighlighted ? 'true' : 'false'} 
      className={`flex gap-3 text-sm rounded-md py-2 transition-colors ${isHighlighted ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`} 
      style={{ paddingLeft: 0 + maxIndent * 6 }}
    >
      <UserAvatar
        className="h-6 w-6 mt-0.5 shrink-0"
        name={node.comment.profiles?.display_name || node.comment.profiles?.username || "User"}
        username={node.comment.profiles?.username || null}
        userId={node.comment.profiles?.id || null}
        src={node.comment.profiles?.avatar_url || null}
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {node.comment.profiles?.display_name || node.comment.profiles?.username || "User"}
          </span>
          <span className="text-xs text-muted-foreground">{new Date(node.comment.created_at).toLocaleString()}</span>
          {node.comment.timestamp_ms !== null && (
            <button
              type="button"
              onClick={() => { if (onSeekToTimestamp) onSeekToTimestamp(Number(node.comment.timestamp_ms)); }}
              className="inline-flex"
              title={t("seekToTime", { defaultValue: "Seek to time" })}
            >
              <Badge variant="secondary" className="text-[10px]">{formatMs(Number(node.comment.timestamp_ms))}</Badge>
            </button>
          )}
          {node.comment.edited && <span className="text-[10px] text-muted-foreground">{t("edited")}</span>}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer"><Pencil className="h-3.5 w-3.5 mr-2" />{t("edit")}</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await del.mutateAsync(String(node.comment.id)); }} className="cursor-pointer text-red-600" asChild>
                  <button type="button" className="w-full text-left flex items-center"><Trash2 className="h-3.5 w-3.5 mr-2" />{t("delete")}</button>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await onToggleResolved(node.comment); if (!node.comment.resolved) setShowAllReplies(false); }} className="cursor-pointer">{node.comment.resolved ? t("markUnresolved") : t("markResolved")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isEditing ? (
          <div className="mt-1 flex items-end gap-2">
            <CommentMentionInput
              projectId={projectId}
              value={draft}
              onChange={setDraft}
              placeholder=""
              rows={3}
              className="text-sm"
              disabled={isPending}
            />
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleSaveEdit}
              disabled={isPending || !draft.trim()}
            >
              {isPending ? t("saving") : t("save")}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { 
                setDraft(node.comment.comment); 
                setIsEditing(false); 
              }}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          </div>
        ) : (
          <p className="mt-1 break-words">
            <HighlightedText 
              text={node.comment.comment} 
              validUsernames={validMemberUsernames}
            />
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <button type="button" onClick={() => setIsReplying((v) => !v)} className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1">
            <CornerUpRight className="h-3 w-3" />{t("reply")}
          </button>
        </div>
        {isReplying && (
          <div className="mt-2 flex gap-2">
            <CommentMentionInput
              projectId={projectId}
              value={replyText}
              onChange={setReplyText}
              placeholder={t("addReply")}
              rows={2}
              disabled={isPending}
            />
            <Button 
              size="sm" 
              onClick={handleReplySubmit}
              disabled={isPending || !replyText.trim()} 
              className="self-end"
            >
              {isPending ? t("posting") : t("post")}
            </Button>
          </div>
        )}
        {node.children.length > 0 && (
          <div role="group" className="mt-2 space-y-2">
            {(showAllReplies ? node.children : node.children.slice(0, 3)).map((child) => (
              <Thread 
                key={String(child.comment.id)} 
                node={child} 
                depth={depth + 1} 
                onReply={onReply} 
                onToggleResolved={onToggleResolved} 
                projectId={projectId} 
                onSeekToTimestamp={onSeekToTimestamp} 
                highlightedCommentId={highlightedCommentId}
                validMemberUsernames={validMemberUsernames}
              />
            ))}
            {node.children.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                onClick={() => setShowAllReplies((v) => !v)}
              >
                {showAllReplies ? t("hideThread") : t("viewThread")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


