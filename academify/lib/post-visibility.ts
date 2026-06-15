import { ModerationStatus } from "@prisma/client";

type PostLike = {
  moderationStatus: ModerationStatus | string;
  authorID: string;
  forumID?: string;
};

type ViewerLike = {
  id: string;
  role?: string | null;
  moderatedForumIds?: string[];
} | null;

export function canViewPost(post: PostLike, viewer: ViewerLike) {
  if (post.moderationStatus === ModerationStatus.APPROVED) {
    return true;
  }

  if (!viewer) {
    return false;
  }

  const role = String(viewer.role ?? "").toLowerCase();
  if (role === "admin") {
    return true;
  }

  if (post.forumID && viewer.moderatedForumIds?.includes(post.forumID)) {
    return true;
  }

  return viewer.id === post.authorID;
}

export function shouldShowModerationStatus(status: ModerationStatus | string) {
  return String(status).toUpperCase() !== ModerationStatus.APPROVED;
}

export function moderationStatusLabelClass(status: ModerationStatus | string) {
  const normalized = String(status).toUpperCase();
  if (normalized === ModerationStatus.BLOCKED) {
    return "text-red-600 font-semibold";
  }
  return "text-amber-600 font-semibold";
}
