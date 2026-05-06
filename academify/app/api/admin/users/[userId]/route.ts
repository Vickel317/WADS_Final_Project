import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole, verifyToken } from "@/lib/auth-session";
import { adminUsers } from "../route";




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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { userId  } = await params;

    // Prevent self-deletion
    if (userId === decoded.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const index = adminUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    adminUsers.splice(index, 1);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




