import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";


type AdminAnalytics = {
  users: { total: number; byRole: Record<string, number>; byStatus: Record<string, number> };
  posts: { total: number; totalReplies: number };
  reports: { total: number; byStatus: Record<string, number> };
  moderation: { totalActions: number; byAction: Record<string, number> };
  aiModeration: Array<{
    id: string;
    title: string;
    status: string;
    aiScore?: number | null;
    aiLabel?: string | null;
    aiReason?: string | null;
    author: string;
    createdAt: string;
  }>;
};

function buildEmptyAnalytics(): AdminAnalytics {
  return {
    users: {
      total: 0,
      byRole: {},
      byStatus: { active: 0 },
    },
    posts: {
      total: 0,
      totalReplies: 0,
    },
    reports: {
      total: 0,
      byStatus: {},
    },
    moderation: {
      totalActions: 0,
      byAction: {},
    },
    aiModeration: [],
  };
}



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

    const [totalPosts, totalComments, users, reportStatuses, moderationActions, recentPosts] =
      await Promise.all([
        prisma.post.count(),
        prisma.comment.count(),
        prisma.user.findMany({ select: { role: true } }),
        prisma.reportReview.findMany({ select: { status: true } }),
        prisma.moderationActionLog.findMany({ select: { actionType: true } }),
        prisma.post.findMany({
          select: {
            postID: true,
            title: true,
            moderationStatus: true,
            aiScore: true,
            aiLabel: true,
            aiReason: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
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
      aiModeration: recentPosts.map((post) => ({
        id: post.postID,
        title: post.title,
        status: String(post.moderationStatus).toLowerCase(),
        aiScore: post.aiScore,
        aiLabel: post.aiLabel,
        aiReason: post.aiReason,
        author: post.author.name,
        createdAt: post.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return NextResponse.json(
      {
        analytics: buildEmptyAnalytics(),
        warning: "Database unavailable; showing empty analytics.",
      },
      { status: 200 }
    );

  }
}

