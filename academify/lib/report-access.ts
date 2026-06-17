import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canAccessModerationQueue,
  canModerateForumContent,
  getModeratedForumIds,
  isPlatformAdmin,
} from "@/lib/forum-permissions";

type ReportRecord = {
  reportedPostID: string | null;
  reportedCommentID: string | null;
  reportedUserID: string | null;
  reportedForumID?: string | null;
};

export async function resolveReportForumId(report: ReportRecord): Promise<string | null> {
  if (report.reportedForumID) return report.reportedForumID;
  if (report.reportedPostID) {
    const post = await prisma.post.findUnique({
      where: { postID: report.reportedPostID },
      select: { forumID: true },
    });
    return post?.forumID ?? null;
  }
  if (report.reportedCommentID) {
    const comment = await prisma.comment.findUnique({
      where: { commentID: report.reportedCommentID },
      select: { post: { select: { forumID: true } } },
    });
    return comment?.post?.forumID ?? null;
  }
  return null;
}

export async function canModerateReport(
  userId: string,
  role: string | null | undefined,
  report: ReportRecord
): Promise<boolean> {
  if (isPlatformAdmin(role)) return true;
  const forumId = await resolveReportForumId(report);
  if (!forumId) return false;
  return canModerateForumContent(userId, forumId, role);
}

export function forumScopedReportWhere(forumIds: string[]): Prisma.ReportReviewWhereInput {
  if (forumIds.length === 0) {
    return { reportreviewID: "__none__" };
  }
  return {
    OR: [
      { reportedForumID: { in: forumIds } },
      { reportedPost: { forumID: { in: forumIds } } },
      { reportedComment: { post: { forumID: { in: forumIds } } } },
    ],
  };
}

export async function buildReportListWhere(
  userId: string,
  role: string | null | undefined
): Promise<Prisma.ReportReviewWhereInput | null> {
  if (!(await canAccessModerationQueue(userId, role))) {
    return null;
  }
  if (isPlatformAdmin(role)) {
    return {};
  }
  const forumIds = await getModeratedForumIds(userId);
  return forumScopedReportWhere(forumIds);
}
