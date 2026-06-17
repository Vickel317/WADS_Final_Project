import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

import { UserRole, UserStatus } from "@prisma/client";



/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, moderator, admin]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, banned]
 *         description: Filter by account status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (decoded.role !== "admin") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role")?.toUpperCase();
    const statusFilter = searchParams.get("status")?.toLowerCase();
    const search = searchParams.get("search")?.toLowerCase();

    const STATUS_MAP: Record<string, UserStatus> = {
      active: UserStatus.ACTIVE,
      warned: UserStatus.WARNED,
      suspended: UserStatus.SUSPENDED,
      banned: UserStatus.BANNED,
    };

    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      return apiError(400, "Invalid role", "BAD_REQUEST");
    }

    if (statusFilter && !STATUS_MAP[statusFilter]) {
      return apiError(400, "Invalid status", "BAD_REQUEST");
    }

    const where = {
      ...(role ? { role: role as UserRole } : {}),
      ...(statusFilter ? { accountStatus: STATUS_MAP[statusFilter] } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({ where });

    return NextResponse.json(
      {
        users: users.map((user) => ({
          id: user.userId,
          email: user.email,
          name: user.name,
          role: user.role.toLowerCase(),
          status: user.accountStatus.toLowerCase(),
          createdAt: user.createdAt.toISOString(),
        })),
        total: users.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin get users error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}





