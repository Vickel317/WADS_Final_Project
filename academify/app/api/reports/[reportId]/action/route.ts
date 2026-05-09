import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString, parseRequiredString } from "@/lib/validation";




/**
 * @swagger
 * /api/reports/{reportId}/action:
 *   post:
 *     summary: Take action on a report (Moderator/Admin only)
 *     tags: [Reports]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [resolve, dismiss]
 *                 example: resolve
 *               note:
 *                 type: string
 *                 example: Content removed and user warned.
 *     responses:
 *       200:
 *         description: Action taken on report
 *       400:
 *         description: Missing or invalid action
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
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

    const { reportId  } = await params;
    const existing = await prisma.reportReview.findUnique({
      where: { reportreviewID: reportId },
    });

    if (!existing) {
      return apiError(404, "Report not found", "NOT_FOUND");
    }

    const body = await parseJson<{ action?: unknown; note?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const action = parseRequiredString(body.action);
    const note = parseOptionalString(body.note);
    const errors = [] as Array<{ field?: string; message: string }>;

    if (action.error) errors.push({ field: "action", message: `action ${action.error}` });
    if (note.error) errors.push({ field: "note", message: `note ${note.error}` });

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    if (!action.value || !["resolve", "dismiss"].includes(action.value)) {
      return apiError(400, "action must be 'resolve' or 'dismiss'", "BAD_REQUEST");
    }

    const newStatus = action.value === "resolve" ? ReportStatus.RESOLVED : ReportStatus.DISMISSED;

    const updated = await prisma.reportReview.update({
      where: { reportreviewID: reportId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: `Report ${action.value === "resolve" ? "resolved" : "dismissed"} successfully`,
        report: {
          id: updated.reportreviewID,
          reportedBy: updated.reporterID,
          targetType: updated.reportedPostID
            ? "post"
            : updated.reportedCommentID
              ? "comment"
              : "user",
          targetId:
            updated.reportedPostID ||
            updated.reportedCommentID ||
            updated.reportedUserID ||
            "",
          reason: updated.reason,
          status: updated.status === ReportStatus.UNDER_REVIEW
            ? "reviewed"
            : updated.status.toLowerCase(),
          reviewNote: note.value || null,
          reviewedBy: decoded.id,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Report action error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




