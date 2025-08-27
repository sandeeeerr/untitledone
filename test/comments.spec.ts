import { describe, it, expect } from 'vitest';
import { buildCommentTree } from '@/lib/utils/comments';

const make = (id: string, parentId: string | null, createdAt: string) => ({
  id,
  project_id: 'p1',
  parent_id: parentId,
  activity_change_id: 'a1',
  version_id: null,
  file_id: null,
  user_id: 'u1',
  comment: `c-${id}`,
  created_at: createdAt,
  updated_at: createdAt,
  edited: false,
  resolved: false,
  timestamp_ms: null,
  profiles: null,
});

describe('buildCommentTree', () => {
  it('builds a tree with correct parent-child relationships and sorting', () => {
    const data = [
      make('1', null, '2024-01-01T00:00:00Z'),
      make('2', '1', '2024-01-01T00:00:01Z'),
      make('3', '1', '2024-01-01T00:00:02Z'),
      make('4', '2', '2024-01-01T00:00:03Z'),
      make('5', null, '2024-01-01T00:00:04Z'),
    ] as any;

    const tree = buildCommentTree(data);
    expect(tree.length).toBe(2);
    expect(tree[0].comment.id).toBe('1');
    expect(tree[0].children.length).toBe(2);
    expect(tree[0].children[0].comment.id).toBe('2');
    expect(tree[0].children[0].children[0].comment.id).toBe('4');
    expect(tree[1].comment.id).toBe('5');
  });
});


