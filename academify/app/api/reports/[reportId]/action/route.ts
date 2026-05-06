import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole, verifyToken } from "@/lib/auth-session";
import { reports } from "../../route";




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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    const { reportId  } = await params;
    const index = reports.findIndex((r) => r.id === reportId);

    if (index === -1) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, note } = body;

    if (!action || !["resolve", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'resolve' or 'dismiss'" },
        { status: 400 }
      );
    }

    const newStatus = action === "resolve" ? "resolved" : "dismissed";

    reports[index] = {
      ...reports[index],
      status: newStatus,
      reviewNote: note || reports[index].reviewNote,
      reviewedBy: decoded.id,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: `Report ${newStatus} successfully`,
        report: reports[index],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Report action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




