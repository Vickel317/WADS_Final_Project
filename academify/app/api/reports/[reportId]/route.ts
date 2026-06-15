import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { apiError } from "@/lib/api-response";
import { resolveReportTarget } from "@/lib/report-target";




/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     summary: Get a single report
 *     tags: [Reports]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { reportId  } = await params;
    const report = await prisma.reportReview.findUnique({
      where: { reportreviewID: reportId },
    });

    if (!report) {
      return apiError(404, "Report not found", "NOT_FOUND");
    }

    // Reporter can view their own report; moderators/admins can view all
    const isModOrAdmin =
      decoded.role === "moderator" || decoded.role === "admin";
    if (report.reporterID !== decoded.id && !isModOrAdmin) {
      return apiError(
        403,
        "Forbidden: You can only view your own reports",
        "FORBIDDEN"
      );
    }

    const target = resolveReportTarget(report);

    return NextResponse.json(
      {
        report: {
          id: report.reportreviewID,
          reportedBy: report.reporterID,
          targetType: target.targetType,
          targetId: target.targetId,
          reason: report.reason,
          status:
            report.status === ReportStatus.UNDER_REVIEW
              ? "reviewed"
              : report.status.toLowerCase(),
          reviewNote: null,
          reviewedBy: null,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.reviewedAt ? report.reviewedAt.toISOString() : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get report error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




