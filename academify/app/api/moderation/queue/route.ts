import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";


// Shared moderation log (imported by other moderation routes)
export const moderationLogs: Array<{
  id: string;
  action:
    | "approve"
    | "delete"
    | "warn"
    | "suspend"
    | "ban"
    | "report_resolved"
    | "report_dismissed";
  targetType: "post" | "user";
  targetId: string;
  performedBy: string;
  reason?: string;
  createdAt: string;
}> = [];



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

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const queue = await prisma.post.findMany({
      where: {
        moderationStatus: {
          in: [ModerationStatus.PENDING, ModerationStatus.FLAGGED],
        },
      },
      include: {
        author: { select: { name: true } },
        forum: { select: { name: true } },
        comments: { select: { commentID: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        queue: queue.map((post) => ({
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
        })),
        total: queue.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get moderation queue error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}



