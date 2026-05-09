import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { moderationLogs } from "../../queue/route";
import { apiError } from "@/lib/api-response";




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

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const { postId } = await params;
    const existing = await prisma.post.findUnique({ where: { postID: postId } });

    if (!existing) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    const updatedPost = await prisma.post.update({
      where: { postID: postId },
      data: { moderationStatus: ModerationStatus.APPROVED },
    });

    moderationLogs.push({
      id: `log_${Date.now()}`,
      action: "approve",
      targetType: "post",
      targetId: postId,
      performedBy: decoded.id,
      createdAt: new Date().toISOString(),
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




