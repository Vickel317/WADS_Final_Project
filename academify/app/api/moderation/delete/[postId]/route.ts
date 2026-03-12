import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { threads } from "@/app/api/posts/route";
import { moderationLogs } from "@/app/api/moderation/queue/route";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/moderation/delete/{postId}:
 *   post:
 *     summary: Delete a post via moderation (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
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
  { params }: { params: { postId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    const { postId } = params;
    const index = threads.findIndex((t) => t.id === postId);

    if (index === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    threads.splice(index, 1);

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
