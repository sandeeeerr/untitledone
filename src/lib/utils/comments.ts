import { type ProjectComment } from "@/lib/api/comments";

export interface CommentTreeNode {
  comment: ProjectComment;
  children: CommentTreeNode[];
}

export function buildCommentTree(comments: ProjectComment[]): CommentTreeNode[] {
  const byId = new Map<string, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];
  // Initialize nodes
  for (const c of comments) {
    const id = String(c.id);
    byId.set(id, { comment: c, children: [] });
  }
  // Link children
  for (const c of comments) {
    const id = String(c.id);
    const parentId = c.parent_id ? String(c.parent_id) : null;
    const node = byId.get(id)!;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // Sort threads by created_at asc for readability
  const sortRecursive = (nodes: CommentTreeNode[]) => {
    nodes.sort(
      (a, b) => new Date(a.comment.created_at).getTime() - new Date(b.comment.created_at).getTime(),
    );
    nodes.forEach((n) => sortRecursive(n.children));
  };
  sortRecursive(roots);
  return roots;
}


