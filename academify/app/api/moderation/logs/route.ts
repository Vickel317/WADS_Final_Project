import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { moderationLogs } from "@/app/api/moderation/queue/route";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
 * /api/moderation/logs:
 *   get:
 *     summary: Get moderation action logs (Moderator/Admin only)
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of log entries to return
 *     responses:
 *       200:
 *         description: List of moderation log entries
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Moderator/Admin only
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "moderator" && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Moderator or Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = moderationLogs.slice(-limit).reverse();

    return NextResponse.json({ logs, total: moderationLogs.length }, { status: 200 });
  } catch (error) {
    console.error("Get moderation logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
