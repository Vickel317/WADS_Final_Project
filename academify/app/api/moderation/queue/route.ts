import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { canAccessModerationQueue, MODERATION_QUEUE_STATUSES } from "@/lib/moderation";
import { getModeratedForumIds, isPlatformAdmin } from "@/lib/forum-permissions";



/**
 * @swagger
 * /api/moderation/queue:
 *   get:
 *     summary: Get content pending moderation (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200:
 *         description: List of posts pending moderation
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (!(await canAccessModerationQueue(decoded.id, decoded.role))) {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const isAdmin = isPlatformAdmin(decoded.role);
    const moderatedForumIds = isAdmin ? null : await getModeratedForumIds(decoded.id);
    const forumFilter =
      moderatedForumIds && moderatedForumIds.length > 0
        ? { forumID: { in: moderatedForumIds } }
        : moderatedForumIds
          ? { forumID: { in: [] } }
          : {};

    const queue = await prisma.post.findMany({
      where: {
        ...forumFilter,
        moderationStatus: {
          in: [...MODERATION_QUEUE_STATUSES],
        },
      },
      include: {
        author: { select: { name: true } },
        forum: { select: { name: true } },
        comments: { select: { commentID: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const approvedForReview = await prisma.post.findMany({
      where: {
        ...forumFilter,
        moderationStatus: ModerationStatus.APPROVED,
        OR: [
          { aiReason: { not: null } },
          { aiScore: { not: null } },
          { aiLabel: { not: null } },
        ],
      },
      include: {
        author: { select: { name: true } },
        forum: { select: { name: true } },
        comments: { select: { commentID: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const mapPost = (post: (typeof queue)[number]) => ({
      id: post.postID,
      title: post.title,
      content: post.content,
      forumId: post.forumID,
      forum: post.forum.name,
      author: post.author.name,
      replyCount: post.comments.length,
      createdAt: post.createdAt.toISOString(),
      status: post.moderationStatus.toLowerCase(),
      aiScore: post.aiScore,
      aiLabel: post.aiLabel,
      aiReason: post.aiReason,
    });

    return NextResponse.json(
      {
        queue: queue.map(mapPost),
        approvedForReview: approvedForReview.map(mapPost),
        total: queue.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get moderation queue error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}



