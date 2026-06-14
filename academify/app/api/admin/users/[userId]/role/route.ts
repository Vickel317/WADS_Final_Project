import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
// UserRole enum is provided by Prisma client; avoid importing directly to prevent mismatches
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";


const VALID_ROLES = ["student", "moderator", "admin"];

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update a user's role (Admin only)
 *     tags: [Admin]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, moderator, admin]
 *                 example: moderator
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Missing or invalid role
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (decoded.role.toLowerCase() !== "admin") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const { userId } = await params;

    if (userId === decoded.id) {
      return apiError(400, "Cannot change your own role", "BAD_REQUEST");
    }

    const body = await parseJson<{ role?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const role = parseRequiredString(body.role);
    if (role.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "role", message: `role ${role.error}` },
      ]);
    }

    if (!role.value || !VALID_ROLES.includes(role.value)) {
      return apiError(
        400,
        `Role must be one of: ${VALID_ROLES.join(", ")}`,
        "BAD_REQUEST"
      );
    }

    const existing = await prisma.user.findUnique({ where: { userId } });
    if (!existing) {
      return apiError(404, "User not found", "NOT_FOUND");
    }

    const updated = await prisma.user.update({
      where: { userId },
      data: { role: role.value.toUpperCase() as UserRole },
    });

    return NextResponse.json(
      {
        message: "User role updated successfully",
        user: {
          id: updated.userId,
          email: updated.email,
          name: updated.name,
          role: updated.role.toLowerCase(),
          status: "active",
          createdAt: updated.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update role error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}



