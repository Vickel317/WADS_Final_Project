import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { adminUsers } from "@/app/api/admin/users/route";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const VALID_ROLES = ["student", "instructor", "moderator", "admin"];

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update a user's role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [student, instructor, moderator, admin]
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
  { params }: { params: { userId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `Role must be one of: ${VALID_ROLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const index = adminUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    adminUsers[index] = {
      ...adminUsers[index],
      role: role as "student" | "instructor" | "moderator" | "admin",
    };

    return NextResponse.json(
      {
        message: "User role updated successfully",
        user: adminUsers[index],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
