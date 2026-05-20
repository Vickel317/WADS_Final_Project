import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";




/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user account (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (decoded.role !== "admin") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const { userId  } = await params;

    // Prevent self-deletion
    if (userId === decoded.id) {
      return apiError(400, "Cannot delete your own account", "BAD_REQUEST");
    }

    const existing = await prisma.user.findUnique({ where: { userId } });
    if (!existing) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    await prisma.user.delete({ where: { userId } });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete user error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




