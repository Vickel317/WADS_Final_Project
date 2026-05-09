import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";




/**
 * @swagger
 * /api/reports/{reportId}/review:
 *   put:
 *     summary: Mark a report as reviewed (Moderator/Admin only)
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
 *             properties:
 *               reviewNote:
 *                 type: string
 *                 example: Reviewed and confirmed as valid report.
 *     responses:
 *       200:
 *         description: Report marked as reviewed
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */

export async function PUT(
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

    const body = await parseJson<{ reviewNote?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const reviewNote = parseOptionalString(body.reviewNote);
    if (reviewNote.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "reviewNote", message: `reviewNote ${reviewNote.error}` },
      ]);
    }

    const updated = await prisma.reportReview.update({
      where: { reportreviewID: reportId },
      data: {
        status: ReportStatus.UNDER_REVIEW,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Report marked as reviewed",
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
          status: "reviewed",
          reviewNote: reviewNote.value || "",
          reviewedBy: decoded.id,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Review report error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




