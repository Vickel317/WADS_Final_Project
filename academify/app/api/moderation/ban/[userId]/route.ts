import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole, verifyToken } from "@/lib/auth-session";
import { moderationLogs } from "../../queue/route";
import { userSanctions } from "../../warn/[userId]/route";




/**
 * @swagger
 * /api/moderation/ban/{userId}:
 *   post:
 *     summary: Permanently ban a user (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Severe harassment and hate speech.
 *     responses:
 *       200:
 *         description: User banned successfully
 *       400:
 *         description: Missing reason
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       500:
 *         description: Internal server error
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId  } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const sanction = {
      id: `sanc_${Date.now()}`,
      userId,
      type: "ban" as const,
      reason,
      issuedBy: decoded.id,
      createdAt: new Date().toISOString(),
    };

    userSanctions.push(sanction);

    moderationLogs.push({
      id: `log_${Date.now()}`,
      action: "ban",
      targetType: "user",
      targetId: userId,
      performedBy: decoded.id,
      reason,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "User banned successfully", sanction },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




