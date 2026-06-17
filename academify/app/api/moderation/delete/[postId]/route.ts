import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";
import { canModerateForumContent } from "@/lib/forum-permissions";
import { recordModerationAction } from "@/lib/moderation";




/**
 * @swagger
 * /api/moderation/delete/{postId}:
 *   post:
 *     summary: Delete a post via moderation (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Violates community guidelines.
 *     responses:
 *       200:
 *         description: Post deleted successfully
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

    const contentLength = request.headers.get("content-length");
    const hasBody = contentLength !== null && contentLength !== "0";
    const body = hasBody ? await parseJson<{ reason?: unknown }>(request) : {};
    if (hasBody && !body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const reason = parseOptionalString(body?.reason);
    if (reason.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "reason", message: `reason ${reason.error}` },
      ]);
    }

    await prisma.post.delete({ where: { postID: postId } });

    await recordModerationAction({
      moderatorId: decoded.id,
      actionType: "DELETE_POST",
      targetPostID: postId,
      reason: reason.value || "No reason provided",
    });

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete post (moderation) error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




