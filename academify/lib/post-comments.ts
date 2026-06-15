import { prisma } from "@/lib/prisma";
import { sortCommentsByLikes } from "@/lib/comment-sort";

export type PostCommentNode = {
  commentID: string;
  postID: string;
  authorID: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  author: { name: string };
  _count: { likes: number };
  replies: PostCommentNode[];
};

type CommentRow = {
  commentID: string;
  postID: string;
  authorID: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  author: { name: string };
};

export async function fetchPostCommentTree(postId: string) {
  const rows = await prisma.comment.findMany({
    where: { postID: postId },
    select: {
      commentID: true,
      postID: true,
      authorID: true,
      content: true,
      parentId: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  const likeCountById = new Map<string, number>();
  if (rows.length > 0) {
    const counts = await prisma.commentLike.groupBy({
      by: ["commentID"],
      where: { commentID: { in: rows.map((row) => row.commentID) } },
      _count: { _all: true },
    });
    for (const entry of counts) {
      likeCountById.set(entry.commentID, entry._count._all);
    }
  }

  const byParent = new Map<string | null, CommentRow[]>();
  for (const row of rows) {
    const key = row.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const build = (parentId: string | null): PostCommentNode[] => {
    const children = byParent.get(parentId) ?? [];
    return sortCommentsByLikes(
      children.map((row) => ({
        ...row,
        _count: { likes: likeCountById.get(row.commentID) ?? 0 },
        replies: build(row.commentID),
      }))
    );
  };

  return {
    topLevel: build(null),
    total: rows.length,
  };
}
