import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { getRecentModerationLogs } from "@/lib/moderation-log-store";
import { canAccessModerationQueue } from "@/lib/moderation";




/**
 * @swagger
 * /api/moderation/logs:
 *   get:
 *     summary: Get moderation action logs (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of log entries to return
 *     responses:
 *       200:
 *         description: List of moderation log entries
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

    if (!(await canAccessModerationQueue(decoded.id, decoded.role))) {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const dbLogs = await prisma.moderationActionLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const logs = dbLogs.length
      ? dbLogs.map((log) => ({
          id: log.ModaiID,
          action:
            log.actionType === "APPROVE_POST"
              ? "approve"
              : log.actionType === "DELETE_POST" || log.actionType === "DELETE_COMMENT"
              ? "delete"
              : log.actionType === "WARN_USER"
              ? "warn"
              : log.actionType === "SUSPEND_USER"
              ? "suspend"
              : log.actionType === "BAN_USER"
              ? "ban"
              : "report_resolved",
          targetType: log.targetUserID ? "user" : "post",
          targetId: log.targetUserID ?? log.targetPostID ?? log.targetCommentID ?? log.relatedReportID ?? "unknown",
          performedBy: log.modID,
          reason: log.reason,
          createdAt: log.timestamp.toISOString(),
        }))
      : getRecentModerationLogs(limit);

    return NextResponse.json({ logs, total: logs.length }, { status: 200 });
  } catch (error) {
    console.error("Get moderation logs error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}



