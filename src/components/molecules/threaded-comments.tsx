"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/atoms/user-avatar";
import { useCreateProjectComment, useUpdateProjectComment, useDeleteProjectComment } from "@/lib/api/queries";
import { type ProjectComment } from "@/lib/api/comments";
import { buildCommentTree, type CommentTreeNode } from "@/lib/utils/comments";
import { CornerUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface ThreadedCommentsProps {
  projectId: string;
  context: { activityChangeId?: string; versionId?: string; fileId?: string };
  comments: ProjectComment[];
  isLoading?: boolean;
}

export default function ThreadedComments({ projectId, context, comments, isLoading }: ThreadedCommentsProps) {
  const t = useTranslations("comments");
  const create = useCreateProjectComment();
  const update = useUpdateProjectComment();
  const del = useDeleteProjectComment(projectId);
  const [newComment, setNewComment] = React.useState("");

  const tree = React.useMemo<CommentTreeNode[]>(() => buildCommentTree(comments || []), [comments]);

  const handlePost = async () => {
    const text = newComment.trim();
    if (!text) return;
    await create.mutateAsync({ projectId, comment: text, ...context });
    setNewComment("");
  };

  const toggleResolved = async (c: ProjectComment) => {
    await update.mutateAsync({ projectId, commentId: String(c.id), resolved: !c.resolved });
  };

  const handleReply = async (parent: ProjectComment, text: string) => {
    await create.mutateAsync({ projectId, comment: text, parentId: String(parent.id), ...context });
  };

  return (
    <div className="w-full space-y-3">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : tree.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t("noCommentsYet")}</div>
      ) : (
        tree.map((node) => <Thread key={String(node.comment.id)} node={node} depth={0} onReply={handleReply} onToggleResolved={toggleResolved} projectId={projectId} />)
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder={t("addComment")}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="text-sm min-h-[60px] resize-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          rows={2}
        />
        <Button size="sm" onClick={handlePost} disabled={!newComment.trim() || create.isPending} className="self-end">
          {create.isPending ? t("posting") : t("post")}
        </Button>
      </div>
    </div>
  );
}

function Thread({ node, depth, onReply, onToggleResolved, projectId }: { node: CommentTreeNode; depth: number; onReply: (parent: ProjectComment, text: string) => Promise<void>; onToggleResolved: (c: ProjectComment) => Promise<void>; projectId: string }) {
  const t = useTranslations("comments");
  const update = useUpdateProjectComment();
  const del = useDeleteProjectComment(projectId);
  const [isReplying, setIsReplying] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(node.comment.comment);
  const maxIndent = Math.min(depth, 6);
  const hasManyReplies = node.children.length > 3;
  const [showAllReplies, setShowAllReplies] = React.useState(!node.comment.resolved && !hasManyReplies);

  return (
    <div role="treeitem" aria-level={depth + 1} aria-selected="false" className="flex gap-3 text-sm p-2 border-l" style={{ paddingLeft: 12 + maxIndent * 6 }}>
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
            <Badge variant="secondary" className="text-[10px]">{Math.floor((node.comment.timestamp_ms as unknown as number) / 1000)}s</Badge>
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
            <Textarea rows={3} className="text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={async () => { const next = draft.trim(); if (next && next !== node.comment.comment) { await update.mutateAsync({ projectId, commentId: String(node.comment.id), comment: next }); } setIsEditing(false); }}>{t("save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setDraft(node.comment.comment); setIsEditing(false); }}>{t("cancel")}</Button>
          </div>
        ) : (
          <p className="mt-1 break-words">{node.comment.comment}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsReplying((v) => !v)}><CornerUpRight className="h-3.5 w-3.5 mr-1" />{t("reply")}</Button>
        </div>
        {isReplying && (
          <div className="mt-2 flex gap-2">
            <Textarea
              placeholder={t("addReply")}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="text-sm min-h-[60px] resize-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              rows={2}
            />
            <Button size="sm" onClick={async () => { if (replyText.trim()) { await onReply(node.comment, replyText.trim()); setReplyText(""); setIsReplying(false); } }} disabled={!replyText.trim()} className="self-end">
              {t("post")}
            </Button>
          </div>
        )}
        {node.children.length > 0 && (
          <div role="group" className="mt-2 space-y-2">
            {(showAllReplies ? node.children : node.children.slice(0, 3)).map((child) => (
              <Thread key={String(child.comment.id)} node={child} depth={depth + 1} onReply={onReply} onToggleResolved={onToggleResolved} projectId={projectId} />
            ))}
            {node.children.length > 3 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowAllReplies((v) => !v)}>
                {showAllReplies ? t("hideThread") : t("viewThread")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


