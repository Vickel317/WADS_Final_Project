type CommentWithLikes = {
  createdAt: Date;
  _count?: { likes?: number };
  replies?: CommentWithLikes[];
};

export function compareCommentsByLikes(a: CommentWithLikes, b: CommentWithLikes) {
  const likeDiff = (b._count?.likes ?? 0) - (a._count?.likes ?? 0);
  if (likeDiff !== 0) return likeDiff;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

export function sortCommentsByLikes<T extends CommentWithLikes>(comments: T[]): T[] {
  return [...comments]
    .sort(compareCommentsByLikes)
    .map((comment) => ({
      ...comment,
      replies: comment.replies
        ? sortCommentsByLikes(comment.replies as T[])
        : comment.replies,
    }));
}

export function topCommentsByLikes<T extends { content: string; _count?: { likes?: number }; createdAt: Date }>(
  comments: T[],
  limit = 20
): T[] {
  return [...comments].sort(compareCommentsByLikes).slice(0, limit);
}
