import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";
import { hasModerationAccess, recordModerationAction } from "@/lib/moderation";

/**
 * POST /api/moderation/restore/{userId}
 * Restore a warned, suspended, or banned user to active (admin only).
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
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const { userId } = await params;
    const target = await prisma.user.findUnique({ where: { userId } });
    if (!target) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    const contentLength = request.headers.get("content-length");
    const hasBody = contentLength !== null && contentLength !== "0";
    const body = hasBody ? await parseJson<{ reason?: unknown }>(request) : {};
    if (hasBody && !body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const reason = parseOptionalString(body?.reason);
    if (reason.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "reason", message: `reason ${reason.error}` },
      ]);
    }

    const updated = await prisma.user.update({
      where: { userId },
      data: { accountStatus: UserStatus.ACTIVE },
      select: { userId: true, accountStatus: true },
    });

    await recordModerationAction({
      moderatorId: decoded.id,
      actionType: "UNBAN_USER",
      targetUserID: userId,
      reason: reason.value || "Account restored to active",
    });

    return NextResponse.json(
      {
        message: "User restored to active",
        user: {
          id: updated.userId,
          accountStatus: updated.accountStatus.toLowerCase(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restore user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
