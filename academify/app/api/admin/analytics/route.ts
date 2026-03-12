import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { adminUsers } from "@/app/api/admin/users/route";
import { threads } from "@/app/api/posts/route";
import { moderationLogs } from "@/app/api/moderation/queue/route";
import { reports } from "@/app/api/reports/route";

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
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const usersByRole = adminUsers.reduce<Record<string, number>>(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {}
    );

    const usersByStatus = adminUsers.reduce<Record<string, number>>(
      (acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const reportsByStatus = reports.reduce<Record<string, number>>(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const moderationActionCounts = moderationLogs.reduce<Record<string, number>>(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {}
    );

    const analytics = {
      users: {
        total: adminUsers.length,
        byRole: usersByRole,
        byStatus: usersByStatus,
      },
      posts: {
        total: threads.length,
        totalViews: threads.reduce((sum, t) => sum + t.views, 0),
        totalReplies: threads.reduce((sum, t) => sum + t.replyCount, 0),
      },
      reports: {
        total: reports.length,
        byStatus: reportsByStatus,
      },
      moderation: {
        totalActions: moderationLogs.length,
        byAction: moderationActionCounts,
      },
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
