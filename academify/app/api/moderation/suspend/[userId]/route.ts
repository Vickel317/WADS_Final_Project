import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalNumber, parseRequiredString } from "@/lib/validation";
import { hasModerationAccess, recordModerationAction } from "@/lib/moderation";

/**
 * @swagger
 * /api/moderation/suspend/{userId}:
 *   post:
 *     summary: Suspend a user temporarily (Admin only)
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
 *                 example: Repeated policy violations.
 *               durationDays:
 *                 type: integer
 *                 example: 7
 *     responses:
 *       200:
 *         description: User suspended successfully
 *       400:
 *         description: Missing reason
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
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
        "Forbidden: Admin access required",
        "FORBIDDEN"
      );
    }

    const { userId } = await params;
    const target = await prisma.user.findUnique({ where: { userId } });
    if (!target) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    const body = await parseJson<{ reason?: unknown; durationDays?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const reason = parseRequiredString(body.reason);
    const durationDays = parseOptionalNumber(body.durationDays);
    const errors = [] as Array<{ field?: string; message: string }>;

    if (reason.error) errors.push({ field: "reason", message: `reason ${reason.error}` });
    if (durationDays.error) {
      errors.push({ field: "durationDays", message: `durationDays ${durationDays.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const updated = await prisma.user.update({
      where: { userId },
      data: { accountStatus: UserStatus.SUSPENDED },
      select: { userId: true, accountStatus: true },
    });

    await recordModerationAction({
      moderatorId: decoded.id,
      actionType: "SUSPEND_USER",
      targetUserID: userId,
      reason: reason.value!,
      duration: durationDays.value ?? null,
    });

    return NextResponse.json(
      {
        message: "User suspended successfully",
        user: {
          id: updated.userId,
          accountStatus: updated.accountStatus.toLowerCase(),
        },
        durationDays: durationDays.value ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Suspend user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
