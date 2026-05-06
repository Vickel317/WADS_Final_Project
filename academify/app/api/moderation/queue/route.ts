import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole, verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";


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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    const queue = await prisma.post.findMany({
      where: { moderationStatus: ModerationStatus.PENDING },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
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
          categoryId: post.categoryID,
          category: post.category.name,
          author: post.author.name,
          replyCount: post.comments.length,
          createdAt: post.createdAt.toISOString(),
          status: post.moderationStatus.toLowerCase(),
        })),
        total: queue.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get moderation queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



