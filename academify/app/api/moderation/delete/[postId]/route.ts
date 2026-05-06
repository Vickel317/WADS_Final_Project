import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole, verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { moderationLogs } from "../../queue/route";




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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    const { postId } = await params;
    const existing = await prisma.post.findUnique({ where: { postID: postId } });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    await prisma.post.delete({ where: { postID: postId } });

    moderationLogs.push({
      id: `log_${Date.now()}`,
      action: "delete",
      targetType: "post",
      targetId: postId,
      performedBy: decoded.id,
      reason: reason || "No reason provided",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete post (moderation) error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




