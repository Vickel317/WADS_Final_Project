import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// TODO: replace with Prisma in Week 7
export let adminUsers: Array<{
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "moderator" | "admin";
  status: "active" | "suspended" | "banned";
  createdAt: string;
}> = [
  {
    id: "user_1",
    email: "john@example.com",
    name: "John Doe",
    role: "student",
    status: "active",
    createdAt: new Date("2026-01-15").toISOString(),
  },
  {
    id: "user_2",
    email: "sarah@example.com",
    name: "Sarah Chen",
    role: "instructor",
    status: "active",
    createdAt: new Date("2026-01-10").toISOString(),
  },
  {
    id: "user_admin",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    status: "active",
    createdAt: new Date("2026-01-01").toISOString(),
  },
];

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
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase();

    let result = adminUsers;

    if (role) result = result.filter((u) => u.role === role);
    if (status) result = result.filter((u) => u.status === status);
    if (search) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(
      { users: result, total: result.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
