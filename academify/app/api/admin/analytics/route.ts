import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";




/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                 posts:
 *                   type: object
 *                 moderation:
 *                   type: object
 *                 reports:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (decoded.role !== "admin") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const [totalPosts, totalComments, users, reportStatuses, moderationActions] =
      await Promise.all([
        prisma.post.count(),
        prisma.comment.count(),
        prisma.user.findMany({ select: { role: true } }),
        prisma.reportReview.findMany({ select: { status: true } }),
        prisma.moderationActionLog.findMany({ select: { actionType: true } }),
      ]);

    const usersByRole = (users as Array<{ role: string }>).reduce<Record<string, number>>(
      (acc, user) => {
        const role = String(user.role).toLowerCase();
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {}
    );

    const usersByStatus = { active: users.length };

    const reportsByStatus = (reportStatuses as Array<{ status: string }>).reduce<
      Record<string, number>
    >((acc, report) => {
      const statusValue = String(report.status);
      const status =
        statusValue === "UNDER_REVIEW"
          ? "reviewed"
          : statusValue.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const moderationActionCounts = (moderationActions as Array<{ actionType: string }>).reduce<
      Record<string, number>
    >((acc, log) => {
      const action = String(log.actionType).toLowerCase();
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
      users: {
        total: users.length,
        byRole: usersByRole,
        byStatus: usersByStatus,
      },
      posts: {
        total: totalPosts,
        totalReplies: totalComments,
      },
      reports: {
        total: reportStatuses.length,
        byStatus: reportsByStatus,
      },
      moderation: {
        totalActions: moderationActions.length,
        byAction: moderationActionCounts,
      },
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

