import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";



function isModOrAdmin(role?: string) {
  return role === "moderator" || role === "admin";
}

const REPORT_STATUS_MAP: Record<string, ReportStatus> = {
  pending: ReportStatus.PENDING,
  reviewed: ReportStatus.UNDER_REVIEW,
  resolved: ReportStatus.RESOLVED,
  dismissed: ReportStatus.DISMISSED,
};

function toResponseStatus(status: ReportStatus) {
  if (status === ReportStatus.UNDER_REVIEW) return "reviewed";
  return status.toLowerCase();
}

function resolveReportTarget(report: {
  reportedPostID: string | null;
  reportedCommentID: string | null;
  reportedUserID: string | null;
}) {
  if (report.reportedPostID) {
    return { targetType: "post" as const, targetId: report.reportedPostID };
  }
  if (report.reportedCommentID) {
    return { targetType: "comment" as const, targetId: report.reportedCommentID };
  }
  if (report.reportedUserID) {
    return { targetType: "user" as const, targetId: report.reportedUserID };
  }
  return { targetType: "post" as const, targetId: "" };
}

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports (Moderator/Admin only)
 *     tags: [Reports]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *         description: Filter by report status
 *     responses:
 *       200:
 *         description: List of reports
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Submit a new report
 *     tags: [Reports]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, reason]
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [post, comment, user]
 *                 example: post
 *               targetId:
 *                 type: string
 *                 example: "1"
 *               reason:
 *                 type: string
 *                 example: This post contains spam.
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (!isModOrAdmin(decoded.role)) {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status
      ? REPORT_STATUS_MAP[status]
        ? { status: REPORT_STATUS_MAP[status] }
        : null
      : undefined;

    if (status && !where) {
      return apiError(
        400,
        "status must be pending, reviewed, resolved, or dismissed",
        "BAD_REQUEST"
      );
    }

    const results = await prisma.reportReview.findMany({
      where: where || undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        reports: results.map((report: any) => {
          const target = resolveReportTarget(report);
          return {
            id: report.reportreviewID,
            reportedBy: report.reporterID,
            targetType: target.targetType,
            targetId: target.targetId,
            reason: report.reason,
            status: toResponseStatus(report.status),
            reviewNote: null,
            reviewedBy: null,
            createdAt: report.createdAt.toISOString(),
            updatedAt: report.reviewedAt ? report.reviewedAt.toISOString() : undefined,
          };
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get reports error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await parseJson<{
      targetType?: unknown;
      targetId?: unknown;
      reason?: unknown;
    }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const targetType = parseRequiredString(body.targetType);
    const targetId = parseRequiredString(body.targetId);
    const reason = parseRequiredString(body.reason);

    if (targetType.error) {
      errors.push({ field: "targetType", message: `targetType ${targetType.error}` });
    }
    if (targetId.error) {
      errors.push({ field: "targetId", message: `targetId ${targetId.error}` });
    }
    if (reason.error) {
      errors.push({ field: "reason", message: `reason ${reason.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    if (!targetType.value || !["post", "comment", "user"].includes(targetType.value)) {
      return apiError(400, "targetType must be post, comment, or user", "BAD_REQUEST");
    }

    const report = await prisma.reportReview.create({
      data: {
        reporterID: decoded.id,
        reason: reason.value!,
        description: reason.value!,
        status: ReportStatus.PENDING,
        reportedPostID: targetType.value === "post" ? targetId.value! : null,
        reportedCommentID: targetType.value === "comment" ? targetId.value! : null,
        reportedUserID: targetType.value === "user" ? targetId.value! : null,
      },
    });

    return NextResponse.json(
      {
        message: "Report submitted successfully",
        report: {
          id: report.reportreviewID,
          reportedBy: report.reporterID,
          targetType: targetType.value,
          targetId: targetId.value!,
          reason: report.reason,
          status: toResponseStatus(report.status),
          reviewNote: null,
          reviewedBy: null,
          createdAt: report.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit report error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}



