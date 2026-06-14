import { ModerationStatus } from "@prisma/client";

type PostLike = {
  moderationStatus: ModerationStatus | string;
  authorID: string;
};

type ViewerLike = {
  id: string;
  role?: string | null;
} | null;

export function canViewPost(post: PostLike, viewer: ViewerLike) {
  if (post.moderationStatus === ModerationStatus.APPROVED) {
    return true;
  }

  if (!viewer) {
    return false;
  }

  const role = String(viewer.role ?? "").toLowerCase();
  if (role === "admin" || role === "moderator") {
    return true;
  }

  return viewer.id === post.authorID;
}
