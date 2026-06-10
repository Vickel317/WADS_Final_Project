import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { userSanctions } from "../../warn/[userId]/route";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";
import { hasModerationAccess, recordModerationAction } from "@/lib/moderation";




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
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (!hasModerationAccess(decoded.role)) {
      return apiError(
        403,
        "Forbidden: Moderator or Admin access required",
        "FORBIDDEN"
      );
    }

    const { userId  } = await params;
    const body = await parseJson<{ reason?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const reason = parseRequiredString(body.reason);
    if (reason.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "reason", message: `reason ${reason.error}` },
      ]);
    }

    const sanction = {
      id: `sanc_${Date.now()}`,
      userId,
      type: "ban" as const,
      reason: reason.value!,
      issuedBy: decoded.id,
      createdAt: new Date().toISOString(),
    };

    userSanctions.push(sanction);

    await recordModerationAction({
      moderatorId: decoded.id,
      actionType: "BAN_USER",
      targetUserID: userId,
      reason: reason.value!,
    });

    return NextResponse.json(
      { message: "User banned successfully", sanction },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ban user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




