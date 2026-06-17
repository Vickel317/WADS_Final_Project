import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { canModerateForumContent } from "@/lib/forum-permissions";
import { recordModerationAction } from "@/lib/moderation";




/**
 * @swagger
 * /api/moderation/approve/{postId}:
 *   post:
 *     summary: Approve a post in the moderation queue (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post approved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { postId } = await params;
    const existing = await prisma.post.findUnique({ where: { postID: postId } });

    if (!existing) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    if (!(await canModerateForumContent(decoded.id, existing.forumID, decoded.role))) {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const updatedPost = await prisma.post.update({
      where: { postID: postId },
      data: { moderationStatus: ModerationStatus.APPROVED },
    });

    await recordModerationAction({
      moderatorId: decoded.id,
      actionType: "APPROVE_POST",
      targetPostID: postId,
      reason: "Post approved by moderator",
    });

    return NextResponse.json(
      {
        message: "Post approved successfully",
        post: {
          id: updatedPost.postID,
          title: updatedPost.title,
          status: updatedPost.moderationStatus.toLowerCase(),
          updatedAt: updatedPost.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approve post error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




