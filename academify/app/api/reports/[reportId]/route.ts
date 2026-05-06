import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole, verifyToken } from "@/lib/auth-session";
import { reports } from "../route";




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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { reportId  } = await params;
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Reporter can view their own report; moderators/admins can view all
    const isModOrAdmin =
      decoded.role === "moderator" || decoded.role === "admin";
    if (report.reportedBy !== decoded.id && !isModOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own reports" },
        { status: 403 }
      );
    }

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




